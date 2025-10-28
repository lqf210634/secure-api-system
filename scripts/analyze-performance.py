#!/usr/bin/env python3
"""
性能测试结果分析脚本
分析 k6 性能测试的 JSON 输出并生成摘要报告
"""

import json
import sys
import argparse
from typing import Dict, Any, List
from datetime import datetime

def analyze_performance_results(results_file: str) -> Dict[str, Any]:
    """分析性能测试结果"""
    try:
        with open(results_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"错误: 找不到结果文件 {results_file}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"错误: 无法解析 JSON 文件 {results_file}")
        sys.exit(1)

    # 提取关键指标
    metrics = data.get('metrics', {})
    
    # HTTP 请求持续时间
    http_req_duration = metrics.get('http_req_duration', {})
    avg_response_time = http_req_duration.get('avg', 0)
    p95_response_time = http_req_duration.get('p(95)', 0)
    p99_response_time = http_req_duration.get('p(99)', 0)
    
    # HTTP 请求失败率
    http_req_failed = metrics.get('http_req_failed', {})
    error_rate = http_req_failed.get('rate', 0) * 100
    
    # 吞吐量
    http_reqs = metrics.get('http_reqs', {})
    total_requests = http_reqs.get('count', 0)
    throughput = http_reqs.get('rate', 0)
    
    # 虚拟用户
    vus = metrics.get('vus', {})
    max_vus = vus.get('max', 0)
    
    # 数据传输
    data_received = metrics.get('data_received', {})
    data_sent = metrics.get('data_sent', {})
    
    # 性能阈值检查
    thresholds = {
        'avg_response_time': {'value': avg_response_time, 'threshold': 500, 'unit': 'ms'},
        'p95_response_time': {'value': p95_response_time, 'threshold': 1000, 'unit': 'ms'},
        'p99_response_time': {'value': p99_response_time, 'threshold': 2000, 'unit': 'ms'},
        'error_rate': {'value': error_rate, 'threshold': 1, 'unit': '%'},
        'throughput': {'value': throughput, 'threshold': 100, 'unit': 'req/s'}
    }
    
    # 计算通过/失败状态
    results = {}
    overall_pass = True
    
    for metric, config in thresholds.items():
        if metric == 'error_rate':
            passed = config['value'] <= config['threshold']
        else:
            passed = config['value'] <= config['threshold'] if metric != 'throughput' else config['value'] >= config['threshold']
        
        results[metric] = {
            'value': round(config['value'], 2),
            'threshold': config['threshold'],
            'unit': config['unit'],
            'passed': passed,
            'status': '✅ PASS' if passed else '❌ FAIL'
        }
        
        if not passed:
            overall_pass = False
    
    # 生成摘要
    summary = {
        'timestamp': datetime.now().isoformat(),
        'overall_status': 'pass' if overall_pass else 'fail',
        'total_requests': total_requests,
        'max_vus': max_vus,
        'test_duration': data.get('state', {}).get('testRunDurationMs', 0) / 1000,
        'avg_response_time': round(avg_response_time, 2),
        'p95_response_time': round(p95_response_time, 2),
        'p99_response_time': round(p99_response_time, 2),
        'error_rate': round(error_rate, 2),
        'throughput': round(throughput, 2),
        'data_received': data_received.get('count', 0),
        'data_sent': data_sent.get('count', 0),
        'results': results
    }
    
    return summary

def generate_report(summary: Dict[str, Any]) -> str:
    """生成性能测试报告"""
    report = f"""
# 性能测试报告

**测试时间**: {summary['timestamp']}
**总体状态**: {'✅ 通过' if summary['overall_status'] == 'pass' else '❌ 失败'}

## 测试概览

- **总请求数**: {summary['total_requests']:,}
- **最大虚拟用户数**: {summary['max_vus']}
- **测试持续时间**: {summary['test_duration']:.1f} 秒
- **数据接收**: {summary['data_received']:,} 字节
- **数据发送**: {summary['data_sent']:,} 字节

## 性能指标

| 指标 | 值 | 阈值 | 状态 |
|------|----|----- |------|
| 平均响应时间 | {summary['avg_response_time']} ms | ≤ {summary['results']['avg_response_time']['threshold']} ms | {summary['results']['avg_response_time']['status']} |
| 95% 响应时间 | {summary['p95_response_time']} ms | ≤ {summary['results']['p95_response_time']['threshold']} ms | {summary['results']['p95_response_time']['status']} |
| 99% 响应时间 | {summary['p99_response_time']} ms | ≤ {summary['results']['p99_response_time']['threshold']} ms | {summary['results']['p99_response_time']['status']} |
| 错误率 | {summary['error_rate']}% | ≤ {summary['results']['error_rate']['threshold']}% | {summary['results']['error_rate']['status']} |
| 吞吐量 | {summary['throughput']} req/s | ≥ {summary['results']['throughput']['threshold']} req/s | {summary['results']['throughput']['status']} |

## 建议

"""
    
    # 添加性能建议
    if summary['avg_response_time'] > 500:
        report += "- ⚠️ 平均响应时间较高，建议优化数据库查询和缓存策略\n"
    
    if summary['error_rate'] > 1:
        report += "- ⚠️ 错误率较高，请检查应用日志和错误处理\n"
    
    if summary['throughput'] < 100:
        report += "- ⚠️ 吞吐量较低，建议优化应用性能和资源配置\n"
    
    if summary['p95_response_time'] > 1000:
        report += "- ⚠️ 95% 响应时间较高，可能存在性能瓶颈\n"
    
    if summary['overall_status'] == 'pass':
        report += "- ✅ 所有性能指标均符合要求\n"
    
    return report

def main():
    parser = argparse.ArgumentParser(description='分析 k6 性能测试结果')
    parser.add_argument('results_file', help='k6 JSON 结果文件路径')
    parser.add_argument('--output', '-o', help='输出报告文件路径', default='performance-report.md')
    parser.add_argument('--json', help='输出 JSON 摘要文件路径', default='performance-summary.json')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    # 分析结果
    summary = analyze_performance_results(args.results_file)
    
    # 生成报告
    report = generate_report(summary)
    
    # 保存报告
    with open(args.output, 'w', encoding='utf-8') as f:
        f.write(report)
    
    # 保存 JSON 摘要
    with open(args.json, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    # 输出结果
    if args.verbose:
        print(report)
    else:
        print(f"性能测试分析完成:")
        print(f"- 总体状态: {'✅ 通过' if summary['overall_status'] == 'pass' else '❌ 失败'}")
        print(f"- 平均响应时间: {summary['avg_response_time']} ms")
        print(f"- 错误率: {summary['error_rate']}%")
        print(f"- 吞吐量: {summary['throughput']} req/s")
        print(f"- 报告已保存到: {args.output}")
        print(f"- JSON 摘要已保存到: {args.json}")
    
    # 如果测试失败，退出码为 1
    if summary['overall_status'] != 'pass':
        sys.exit(1)

if __name__ == '__main__':
    main()