# 阿里云 Terraform 配置
# 部署 FC 函数、OSS 存储桶和相关资源

terraform {
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = "~> 1.200"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

# 配置阿里云 Provider
provider "alicloud" {
  region = var.region
}

# 随机 ID 用于存储桶名称唯一性
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# 数据源：获取当前账户信息
data "alicloud_account" "current" {}

# FC 服务
resource "alicloud_fc_service" "main" {
  name            = "${var.service_name}-${random_id.bucket_suffix.hex}"
  description     = "Tonghua World Video Generation Service"
  internet_access = true
  role            = alicloud_ram_role.fc_role.arn

  log_config {
    project  = alicloud_log_project.main.name
    logstore = alicloud_log_store.main.name
  }
}

# 日志项目
resource "alicloud_log_project" "main" {
  name        = "${var.service_name}-logs-${random_id.bucket_suffix.hex}"
  description = "Logs for Tonghua World service"
}

# 日志存储
resource "alicloud_log_store" "main" {
  project          = alicloud_log_project.main.name
  name             = "fc-logs-${random_id.bucket_suffix.hex}"
  retention_period = 7
}

# FC 函数
resource "alicloud_fc_function" "api" {
  service     = alicloud_fc_service.main.name
  name        = "api"
  description = "API function for video generation"
  
  runtime = "nodejs20"
  handler = "index.handler"
  
  memory_size = 1024
  timeout     = 120
  
  # 代码包
  filename = var.function_zip_path
  
  environment_variables = {
    TONGYI_API_KEY      = var.tongyi_api_key
    OSS_REGION          = var.region
    OSS_BUCKET_UPLOAD   = alicloud_oss_bucket.upload.bucket
    OSS_BUCKET_STATIC   = alicloud_oss_bucket.static.bucket
    TABESTORE_INSTANCE  = var.tablestore_instance
    OIDC_ISSUER         = var.oidc_issuer
    OIDC_JWKS           = var.oidc_jwks
    OIDC_AUD            = var.oidc_aud
    ASSUME_ROLE_ARN     = var.assume_role_arn
  }
}

# HTTP 触发器
resource "alicloud_fc_trigger" "http" {
  service  = alicloud_fc_service.main.name
  function = alicloud_fc_function.api.name
  name     = "httpTrigger"
  type     = "http"
  
  config = jsonencode({
    authType = "anonymous"
    methods  = ["GET", "POST", "OPTIONS"]
  })
}

# OSS 存储桶 - 上传
resource "alicloud_oss_bucket" "upload" {
  bucket = "draworld2025-${random_id.bucket_suffix.hex}"
  acl    = "private"

  cors_rule {
    allowed_origins = ["*"]
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# OSS 存储桶 - 静态文件
resource "alicloud_oss_bucket" "static" {
  bucket = "draworld2-${random_id.bucket_suffix.hex}"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "error.html"
  }

  cors_rule {
    allowed_origins = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# OSS 存储桶策略已通过 ACL 设置为 public-read，无需额外策略

# RAM 角色 - FC 执行角色
resource "alicloud_ram_role" "fc_role" {
  name = "${var.service_name}-fc-role-${random_id.bucket_suffix.hex}"
  
  document = jsonencode({
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["fc.aliyuncs.com"]
        }
      }
    ]
    Version = "1"
  })
  
  description = "FC execution role for Tonghua World"
}

# RAM 策略附加 - 基础执行权限
resource "alicloud_ram_role_policy_attachment" "fc_basic" {
  role_name   = alicloud_ram_role.fc_role.name
  policy_name = "AliyunFCInvocationAccess"
  policy_type = "System"
}

# RAM 策略附加 - 日志权限
resource "alicloud_ram_role_policy_attachment" "fc_logs" {
  role_name   = alicloud_ram_role.fc_role.name
  policy_name = "AliyunLogFullAccess"
  policy_type = "System"
}

# RAM 策略附加 - OSS 权限
resource "alicloud_ram_role_policy_attachment" "fc_oss" {
  role_name   = alicloud_ram_role.fc_role.name
  policy_name = "AliyunOSSFullAccess"
  policy_type = "System"
}

# RAM 策略附加 - Tablestore 权限
resource "alicloud_ram_role_policy_attachment" "fc_ots" {
  role_name   = alicloud_ram_role.fc_role.name
  policy_name = "AliyunOTSFullAccess"
  policy_type = "System"
}
