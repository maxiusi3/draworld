# Terraform 变量定义

variable "region" {
  description = "阿里云区域"
  type        = string
  default     = "cn-hangzhou"
}

variable "service_name" {
  description = "FC 服务名称"
  type        = string
  default     = "tonghua-world-svc"
}

variable "function_zip_path" {
  description = "函数代码包路径"
  type        = string
  default     = "../serverless/fc/function.zip"
}

variable "tongyi_api_key" {
  description = "通义千问 API 密钥"
  type        = string
  sensitive   = true
}

variable "oss_bucket_upload" {
  description = "OSS 上传存储桶名称"
  type        = string
  default     = "draworld2025"
}

variable "oss_bucket_static" {
  description = "OSS 静态文件存储桶名称"
  type        = string
  default     = "draworld2"
}

variable "tablestore_instance" {
  description = "Tablestore 实例名称"
  type        = string
  default     = "i01wvvv53p0q"
}

variable "oidc_issuer" {
  description = "OIDC 发行者 URL"
  type        = string
  default     = "https://draworld.authing.cn/oidc"
}

variable "oidc_jwks" {
  description = "OIDC JWKS URL"
  type        = string
  default     = "https://draworld.authing.cn/oidc/.well-known/jwks.json"
}

variable "oidc_aud" {
  description = "OIDC 受众"
  type        = string
  default     = "689adde75ecb97cd396860eb"
}

variable "assume_role_arn" {
  description = "STS 角色 ARN"
  type        = string
  default     = "acs:ram::1950683455496289:role/upload"
}
