import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * HTTP function to get analytics dashboard data
 */
export const getAnalyticsDashboard = functions.https.onCall(
  async (data, context) => {
    // Check authentication and admin role
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData?.role || userData.role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can access analytics"
      );
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get user metrics
      const totalUsersSnapshot = await db.collection("users").get();
      const totalUsers = totalUsersSnapshot.size;

      const newUsersLast30DaysSnapshot = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      const newUsersLast30Days = newUsersLast30DaysSnapshot.size;

      const newUsersLast7DaysSnapshot = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .get();
      const newUsersLast7Days = newUsersLast7DaysSnapshot.size;

      // Get video creation metrics
      const totalVideosSnapshot = await db.collection("videoCreations").get();
      const totalVideos = totalVideosSnapshot.size;

      const videosLast30DaysSnapshot = await db
        .collection("videoCreations")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
        .get();
      const videosLast30Days = videosLast30DaysSnapshot.size;

      const completedVideosSnapshot = await db
        .collection("videoCreations")
        .where("status", "==", "completed")
        .get();
      const completedVideos = completedVideosSnapshot.size;

      // Get revenue metrics
      const paymentsSnapshot = await db
        .collection("payments")
        .where("status", "==", "succeeded")
        .get();

      let totalRevenue = 0;
      let revenueLastMonth = 0;
      
      paymentsSnapshot.docs.forEach((doc) => {
        const payment = doc.data();
        const amount = payment.amount || 0;
        totalRevenue += amount;
        
        if (payment.createdAt && payment.createdAt.toDate() >= thirtyDaysAgo) {
          revenueLastMonth += amount;
        }
      });

      // Calculate conversion rates
      const conversionRate = totalUsers > 0 ? (completedVideos / totalUsers) * 100 : 0;
      const paidUsers = paymentsSnapshot.size;
      const paidConversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

      // Get referral metrics
      const referralsSnapshot = await db.collection("referrals").get();
      const totalReferrals = referralsSnapshot.size;

      let completedReferrals = 0;
      referralsSnapshot.docs.forEach((doc) => {
        const referral = doc.data();
        if (referral.firstVideoBonusAwarded) {
          completedReferrals++;
        }
      });

      const kFactor = totalUsers > 0 ? totalReferrals / totalUsers : 0;

      return {
        users: {
          total: totalUsers,
          newLast30Days: newUsersLast30Days,
          newLast7Days: newUsersLast7Days,
          growthRate: totalUsers > newUsersLast30Days ? 
            ((newUsersLast30Days / (totalUsers - newUsersLast30Days)) * 100) : 0,
        },
        videos: {
          total: totalVideos,
          completed: completedVideos,
          last30Days: videosLast30Days,
          successRate: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
        },
        revenue: {
          total: totalRevenue,
          lastMonth: revenueLastMonth,
          paidUsers,
          averageRevenuePerUser: paidUsers > 0 ? totalRevenue / paidUsers : 0,
        },
        conversion: {
          visitorToCreator: conversionRate,
          freeToPaid: paidConversionRate,
        },
        referrals: {
          total: totalReferrals,
          completed: completedReferrals,
          kFactor,
          completionRate: totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0,
        },
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
    } catch (error) {
      functions.logger.error("Error getting analytics dashboard:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get analytics data"
      );
    }
  }
);

/**
 * Scheduled function to aggregate daily analytics
 */
export const aggregateDailyAnalytics = functions.pubsub
  .schedule("0 2 * * *") // Run at 2 AM daily
  .timeZone("UTC")
  .onRun(async (context) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Aggregate user metrics
      const newUsersSnapshot = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(today))
        .get();

      // Aggregate video metrics
      const newVideosSnapshot = await db
        .collection("videoCreations")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(today))
        .get();

      // Store daily aggregation
      const dateKey = yesterday.toISOString().split('T')[0];
      await db.collection("dailyAnalytics").doc(dateKey).set({
        date: admin.firestore.Timestamp.fromDate(yesterday),
        newUsers: newUsersSnapshot.size,
        newVideos: newVideosSnapshot.size,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`Daily analytics aggregated for ${dateKey}`);
    } catch (error) {
      functions.logger.error("Error aggregating daily analytics:", error);
    }
  });