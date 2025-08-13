#!/usr/bin/env python3
# coding:utf-8

from volcengine.visual.VisualService import VisualService

# 创建服务实例
visual_service = VisualService()

# 打印所有可用的方法
print("VisualService 可用方法:")
methods = [method for method in dir(visual_service) if not method.startswith('_')]
for method in sorted(methods):
    print(f"  - {method}")

# 查找包含 'cv' 或 'CV' 的方法
print("\n包含 'cv' 或 'CV' 的方法:")
cv_methods = [method for method in methods if 'cv' in method.lower()]
for method in sorted(cv_methods):
    print(f"  - {method}")
