#!/usr/bin/env python3
# coding:utf-8
"""
火山引擎即梦AI API调用脚本
使用官方Python SDK
"""

import sys
import json
import os
from volcengine.visual.VisualService import VisualService

def create_video_task(prompt, aspect_ratio="3:4"):
    """
    创建视频任务
    """
    try:
        # 初始化服务
        visual_service = VisualService()
        
        # 从环境变量获取AK/SK
        ak = os.environ.get('DREAMINA_ACCESS_KEY_ID')
        sk = os.environ.get('DREAMINA_SECRET_ACCESS_KEY')
        
        if not ak or not sk:
            return {
                "success": False,
                "error": "Missing DREAMINA_ACCESS_KEY_ID or DREAMINA_SECRET_ACCESS_KEY environment variables"
            }
        
        # 如果SK是base64编码的，需要解码
        try:
            import base64
            # 尝试base64解码
            decoded_sk = base64.b64decode(sk).decode('utf-8')
            # 如果解码后还是base64格式，再解码一次
            if decoded_sk and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in decoded_sk):
                try:
                    sk = base64.b64decode(decoded_sk).decode('utf-8')
                except:
                    sk = decoded_sk
            else:
                sk = decoded_sk
        except:
            # 如果解码失败，使用原始值
            pass
        
        # 设置AK/SK
        visual_service.set_ak(ak)
        visual_service.set_sk(sk)
        
        # 请求Body - 根据即梦AI文生视频的参数
        form = {
            "req_key": "jimeng_vgfm_t2v_l20",  # 即梦AI文生视频模型
            "prompt": prompt,
            "aspect_ratio": aspect_ratio
        }
        
        # 调用同步接口 - 根据官方文档使用 CVProcess
        # 使用通用处理器调用 CVProcess API
        resp = visual_service.common_json_handler('CVProcess', form)
        
        return {
            "success": True,
            "response": resp
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def get_video_result(task_id):
    """
    获取视频任务结果
    """
    try:
        # 初始化服务
        visual_service = VisualService()
        
        # 从环境变量获取AK/SK
        ak = os.environ.get('DREAMINA_ACCESS_KEY_ID')
        sk = os.environ.get('DREAMINA_SECRET_ACCESS_KEY')
        
        if not ak or not sk:
            return {
                "success": False,
                "error": "Missing DREAMINA_ACCESS_KEY_ID or DREAMINA_SECRET_ACCESS_KEY environment variables"
            }
        
        # 如果SK是base64编码的，需要解码
        try:
            import base64
            # 尝试base64解码
            decoded_sk = base64.b64decode(sk).decode('utf-8')
            # 如果解码后还是base64格式，再解码一次
            if decoded_sk and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=' for c in decoded_sk):
                try:
                    sk = base64.b64decode(decoded_sk).decode('utf-8')
                except:
                    sk = decoded_sk
            else:
                sk = decoded_sk
        except:
            # 如果解码失败，使用原始值
            pass
        
        # 设置AK/SK
        visual_service.set_ak(ak)
        visual_service.set_sk(sk)
        
        # 请求Body
        form = {
            "req_key": "jimeng_vgfm_t2v_l20",
            "task_id": task_id
        }
        
        # 调用同步转异步获取结果接口
        # 根据官方文档，使用 cv_sync2async_get_result 方法
        # 但如果不存在，尝试使用通用的 common_json_handler
        try:
            resp = visual_service.cv_sync2async_get_result(form)
        except AttributeError:
            # 如果方法不存在，使用通用处理器
            resp = visual_service.common_json_handler('CVSync2AsyncGetResult', form)
        
        return {
            "success": True,
            "response": resp
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: python dreamina_api.py <action> [args...]"
        }))
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "create_video":
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "error": "Usage: python dreamina_api.py create_video <prompt> [aspect_ratio]"
            }))
            sys.exit(1)
        
        prompt = sys.argv[2]
        aspect_ratio = sys.argv[3] if len(sys.argv) > 3 else "3:4"
        
        result = create_video_task(prompt, aspect_ratio)
        print(json.dumps(result, ensure_ascii=False))
        
    elif action == "get_result":
        if len(sys.argv) < 3:
            print(json.dumps({
                "success": False,
                "error": "Usage: python dreamina_api.py get_result <task_id>"
            }))
            sys.exit(1)
        
        task_id = sys.argv[2]
        result = get_video_result(task_id)
        print(json.dumps(result, ensure_ascii=False))
        
    else:
        print(json.dumps({
            "success": False,
            "error": f"Unknown action: {action}"
        }))
        sys.exit(1)
