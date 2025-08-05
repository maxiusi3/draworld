import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DreaminaAPIService } from './services/dreamina';

import fetch from 'node-fetch';

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// 创建视频生成任务
export const createVideoTask = functions.https.onCall(async (data, context) => {
  try {
    // 验证用户身份
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '用户未登录');
    }

    const { imageUrl, prompt, musicStyle, aspectRatio } = data;
    
    if (!imageUrl) {
      throw new functions.https.HttpsError('invalid-argument', '图片URL不能为空');
    }

    const userId = context.auth.uid;
    
    // 在Firestore中创建任务记录
    const taskData = {
      userId,
      imageUrl,
      prompt: prompt || '',
      musicStyle: musicStyle || 'Joyful',
      aspectRatio: aspectRatio || '16:9',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const taskRef = await db.collection('videoTasks').add(taskData);
    const taskId = taskRef.id;

    // 异步调用即梦AI API
    const dreaminaService = new DreaminaAPIService();
    
    try {
      const dreaminaTaskId = await dreaminaService.submitTask({
        imageUrl,
        prompt,
        aspectRatio
      });

      // 更新任务状态
      await taskRef.update({
        dreaminaTaskId,
        status: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // 开始轮询任务状态
      await pollTaskStatus(taskId, dreaminaTaskId);

    } catch (error) {
      functions.logger.error('即梦AI API调用失败:', error);
      await taskRef.update({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return { taskId };
    
  } catch (error) {
    functions.logger.error('创建视频任务失败:', error);
    throw new functions.https.HttpsError('internal', '创建任务失败');
  }
});

// 轮询任务状态
async function pollTaskStatus(taskId: string, dreaminaTaskId: string, attempt = 0) {
  const maxAttempts = 60; // 最多轮询5分钟 (每5秒一次)
  const delayMs = 5000; // 5秒间隔

  if (attempt >= maxAttempts) {
    await db.collection('videoTasks').doc(taskId).update({
      status: 'failed',
      error: '任务超时',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return;
  }

  const dreaminaService = new DreaminaAPIService();
  
  try {
    const result = await dreaminaService.getTaskResult(dreaminaTaskId);
    
    if (result.status === 'done' && result.videoUrl) {
      // 将视频URL转存到Firebase Storage
      const savedVideoUrl = await saveVideoToStorage(result.videoUrl, taskId);
      
      await db.collection('videoTasks').doc(taskId).update({
        status: 'completed',
        videoUrl: savedVideoUrl,
        originalVideoUrl: result.videoUrl,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else if (result.status === 'failed') {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: result.error || '生成失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 继续轮询
      setTimeout(() => {
        pollTaskStatus(taskId, dreaminaTaskId, attempt + 1);
      }, delayMs);
    }
  } catch (error) {
    functions.logger.error(`轮询任务状态失败 (attempt ${attempt}):`, error);
    
    // 重试3次后标记为失败
    if (attempt >= 3) {
      await db.collection('videoTasks').doc(taskId).update({
        status: 'failed',
        error: '获取任务状态失败',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      setTimeout(() => {
        pollTaskStatus(taskId, dreaminaTaskId, attempt + 1);
      }, delayMs);
    }
  }
}

// 将视频保存到Firebase Storage
async function saveVideoToStorage(videoUrl: string, taskId: string): Promise<string> {
  try {
    // 下载视频
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    const fileName = `videos/${taskId}.mp4`;
    const file = storage.bucket().file(fileName);
    
    await file.save(buffer, {
      metadata: {
        contentType: 'video/mp4'
      }
    });
    
    // 生成公开URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${fileName}`;
    
    return publicUrl;
  } catch (error) {
    functions.logger.error('保存视频到Storage失败:', error);
    throw error;
  }
}

// 用户管理相关功能
export const createUserProfile = functions.auth.user().onCreate(async (user) => {
  try {
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        language: 'zh-CN',
        notifications: true
      }
    };

    await db.collection('users').doc(user.uid).set(profileData);
    functions.logger.info(`用户资料创建成功: ${user.uid}`);
  } catch (error) {
    functions.logger.error('创建用户资料失败:', error);
  }
});

// 删除用户数据
export const deleteUserData = functions.auth.user().onDelete(async (user) => {
  try {
    const batch = db.batch();
    
    // 删除用户资料
    batch.delete(db.collection('users').doc(user.uid));
    
    // 删除用户的视频任务
    const tasks = await db.collection('videoTasks').where('userId', '==', user.uid).get();
    tasks.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // 删除用户上传的文件
    const userFilesPath = `users/${user.uid}/`;
    const [files] = await storage.bucket().getFiles({ prefix: userFilesPath });
    
    await Promise.all(files.map(file => file.delete()));
    
    functions.logger.info(`用户数据删除成功: ${user.uid}`);
  } catch (error) {
    functions.logger.error('删除用户数据失败:', error);
  }
});

// 获取用户的视频任务列表
export const getUserVideoTasks = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '用户未登录');
    }

    const userId = context.auth.uid;
    const { limit = 20, offset = 0 } = data;
    
    const tasksSnapshot = await db.collection('videoTasks')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();
    
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { tasks };
  } catch (error) {
    functions.logger.error('获取用户视频任务失败:', error);
    throw new functions.https.HttpsError('internal', '获取任务列表失败');
  }
});