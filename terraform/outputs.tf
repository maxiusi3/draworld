# Terraform 输出定义

output "fc_service_name" {
  description = "FC 服务名称"
  value       = alicloud_fc_service.main.name
}

output "fc_function_name" {
  description = "FC 函数名称"
  value       = alicloud_fc_function.api.name
}

output "http_trigger_url" {
  description = "HTTP 触发器 URL"
  value       = "https://${data.alicloud_account.current.id}.${var.region}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.main.name}/${alicloud_fc_function.api.name}/"
}

output "api_endpoints" {
  description = "API 端点列表"
  value = {
    sts_endpoint    = "https://${data.alicloud_account.current.id}.${var.region}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.main.name}/${alicloud_fc_function.api.name}/api/oss/sts"
    video_start     = "https://${data.alicloud_account.current.id}.${var.region}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.main.name}/${alicloud_fc_function.api.name}/api/video/start"
    video_status    = "https://${data.alicloud_account.current.id}.${var.region}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.main.name}/${alicloud_fc_function.api.name}/api/video/status"
    video_list      = "https://${data.alicloud_account.current.id}.${var.region}.fc.aliyuncs.com/2016-08-15/proxy/${alicloud_fc_service.main.name}/${alicloud_fc_function.api.name}/api/video/list"
  }
}

output "oss_bucket_upload" {
  description = "OSS 上传存储桶"
  value       = alicloud_oss_bucket.upload.bucket
}

output "oss_bucket_static" {
  description = "OSS 静态文件存储桶"
  value       = alicloud_oss_bucket.static.bucket
}

output "frontend_url" {
  description = "前端访问 URL（对象存储）"
  value       = "https://${alicloud_oss_bucket.static.bucket}.oss-${var.region}.aliyuncs.com/index.html"
}

output "frontend_website_url" {
  description = "前端访问 URL（静态网站）"
  value       = "https://${alicloud_oss_bucket.static.bucket}.oss-website-${var.region}.aliyuncs.com/"
}

output "oss_upload_endpoint" {
  description = "OSS 上传端点"
  value       = "https://${alicloud_oss_bucket.upload.bucket}.oss-${var.region}.aliyuncs.com"
}

output "oss_static_endpoint" {
  description = "OSS 静态文件端点"
  value       = "https://${alicloud_oss_bucket.static.bucket}.oss-${var.region}.aliyuncs.com"
}

output "log_project" {
  description = "日志项目名称"
  value       = alicloud_log_project.main.name
}

output "fc_role_arn" {
  description = "FC 执行角色 ARN"
  value       = alicloud_ram_role.fc_role.arn
}
