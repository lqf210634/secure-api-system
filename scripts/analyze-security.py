#!/usr/bin/env python3
"""
安全测试结果分析脚本
分析 OWASP ZAP 安全测试的 JSON 输出并生成摘要报告
"""

import json
import sys
import argparse
import glob
from typing import Dict, Any, List
from datetime import datetime

# 风险等级映射
RISK_LEVELS = {
    'High': {'priority': 4, 'emoji': '🔴', 'color': 'red'},
    'Medium': {'priority': 3, 'emoji': '🟡', 'color': 'yellow'},
    'Low': {'priority': 2, 'emoji': '🟢', 'color': 'green'},
    'Informational': {'priority': 1, 'emoji': '🔵', 'color': 'blue'}
}

def analyze_zap_results(results_files: List[str]) -> Dict[str, Any]:
    """分析 OWASP ZAP 安全测试结果"""
    all_alerts = []
    scan_info = {}
    
    for file_path in results_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 提取扫描信息
            site = data.get('site', [])
            if site:
                site_info = site[0]
                scan_info[file_path] = {
                    'name': site_info.get('@name', ''),
                    'host': site_info.get('@host', ''),
                    'port': site_info.get('@port', ''),
                    'ssl': site_info.get('@ssl', False)
                }
                
                # 提取告警信息
                alerts = site_info.get('alerts', [])
                for alert in alerts:
                    alert_info = {
                        'file': file_path,
                        'name': alert.get('name', ''),
                        'riskdesc': alert.get('riskdesc', ''),
                        'confidence': alert.get('confidence', ''),
                        'riskcode': alert.get('riskcode', ''),
                        'desc': alert.get('desc', ''),
                        'solution': alert.get('solution', ''),
                        'reference': alert.get('reference', ''),
                        'instances': alert.get('instances', [])
                    }
                    
                    # 解析风险等级
                    risk_desc = alert_info['riskdesc']
                    if ' - ' in risk_desc:
                        risk_level = risk_desc.split(' - ')[0]
                        confidence_level = risk_desc.split(' - ')[1]
                    else:
                        risk_level = 'Unknown'
                        confidence_level = 'Unknown'
                    
                    alert_info['risk_level'] = risk_level
                    alert_info['confidence_level'] = confidence_level
                    
                    all_alerts.append(alert_info)
                    
        except FileNotFoundError:
            print(f"警告: 找不到结果文件 {file_path}")
            continue
        except json.JSONDecodeError:
            print(f"警告: 无法解析 JSON 文件 {file_path}")
            continue
    
    # 统计风险等级
    risk_counts = {level: 0 for level in RISK_LEVELS.keys()}
    risk_counts['Unknown'] = 0
    
    for alert in all_alerts:
        risk_level = alert['risk_level']
        if risk_level in risk_counts:
            risk_counts[risk_level] += 1
        else:
            risk_counts['Unknown'] += 1
    
    # 按风险等级排序告警
    sorted_alerts = sorted(all_alerts, key=lambda x: RISK_LEVELS.get(x['risk_level'], {'priority': 0})['priority'], reverse=True)
    
    # 生成摘要
    summary = {
        'timestamp': datetime.now().isoformat(),
        'total_alerts': len(all_alerts),
        'high_risk_count': risk_counts['High'],
        'medium_risk_count': risk_counts['Medium'],
        'low_risk_count': risk_counts['Low'],
        'info_risk_count': risk_counts['Informational'],
        'unknown_risk_count': risk_counts['Unknown'],
        'risk_counts': risk_counts,
        'scan_info': scan_info,
        'alerts': sorted_alerts[:20],  # 只保留前20个最高风险的告警
        'overall_status': 'fail' if risk_counts['High'] > 0 else 'pass'
    }
    
    return summary

def generate_security_report(summary: Dict[str, Any]) -> str:
    """生成安全测试报告"""
    report = f"""
# 安全测试报告

**测试时间**: {summary['timestamp']}
**总体状态**: {'❌ 发现高风险漏洞' if summary['overall_status'] == 'fail' else '✅ 未发现高风险漏洞'}

## 扫描概览

- **总告警数**: {summary['total_alerts']}
- **高风险**: {summary['high_risk_count']} 🔴
- **中风险**: {summary['medium_risk_count']} 🟡
- **低风险**: {summary['low_risk_count']} 🟢
- **信息性**: {summary['info_risk_count']} 🔵

## 风险分布

| 风险等级 | 数量 | 状态 |
|----------|------|------|
| 🔴 高风险 | {summary['high_risk_count']} | {'❌ 需要立即修复' if summary['high_risk_count'] > 0 else '✅'} |
| 🟡 中风险 | {summary['medium_risk_count']} | {'⚠️ 建议修复' if summary['medium_risk_count'] > 0 else '✅'} |
| 🟢 低风险 | {summary['low_risk_count']} | {'ℹ️ 可选修复' if summary['low_risk_count'] > 0 else '✅'} |
| 🔵 信息性 | {summary['info_risk_count']} | {'ℹ️ 仅供参考' if summary['info_risk_count'] > 0 else '✅'} |

## 扫描目标

"""
    
    for file_path, info in summary['scan_info'].items():
        protocol = 'https' if info['ssl'] else 'http'
        url = f"{protocol}://{info['host']}:{info['port']}"
        report += f"- **{info['name']}**: {url}\n"
    
    if summary['alerts']:
        report += "\n## 主要安全问题\n\n"
        
        for i, alert in enumerate(summary['alerts'][:10], 1):
            risk_info = RISK_LEVELS.get(alert['risk_level'], {'emoji': '❓'})
            report += f"### {i}. {risk_info['emoji']} {alert['name']}\n\n"
            report += f"**风险等级**: {alert['risk_level']}\n"
            report += f"**置信度**: {alert['confidence_level']}\n"
            report += f"**描述**: {alert['desc'][:200]}...\n" if len(alert['desc']) > 200 else f"**描述**: {alert['desc']}\n"
            
            if alert['solution']:
                report += f"**解决方案**: {alert['solution'][:200]}...\n" if len(alert['solution']) > 200 else f"**解决方案**: {alert['solution']}\n"
            
            if alert['instances']:
                report += f"**影响实例数**: {len(alert['instances'])}\n"
            
            report += "\n---\n\n"
    
    # 添加安全建议
    report += "## 安全建议\n\n"
    
    if summary['high_risk_count'] > 0:
        report += "- 🚨 **立即修复高风险漏洞**: 发现了高风险安全漏洞，需要立即修复\n"
    
    if summary['medium_risk_count'] > 0:
        report += "- ⚠️ **修复中风险漏洞**: 建议在下个版本中修复中风险漏洞\n"
    
    if summary['low_risk_count'] > 0:
        report += "- ℹ️ **考虑修复低风险漏洞**: 可以在后续版本中考虑修复\n"
    
    if summary['total_alerts'] == 0:
        report += "- ✅ **安全状况良好**: 未发现明显的安全漏洞\n"
    
    report += """
## 安全最佳实践

1. **定期安全扫描**: 建议每次发布前进行安全扫描
2. **及时更新依赖**: 保持第三方库和框架的最新版本
3. **输入验证**: 对所有用户输入进行严格验证
4. **访问控制**: 实施最小权限原则
5. **安全头**: 配置适当的 HTTP 安全头
6. **日志监控**: 监控异常访问和攻击尝试
"""
    
    return report

def main():
    parser = argparse.ArgumentParser(description='分析 OWASP ZAP 安全测试结果')
    parser.add_argument('results_files', nargs='+', help='ZAP JSON 结果文件路径（支持通配符）')
    parser.add_argument('--output', '-o', help='输出报告文件路径', default='security-report.md')
    parser.add_argument('--json', help='输出 JSON 摘要文件路径', default='security-summary.json')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    parser.add_argument('--fail-on-high', action='store_true', help='发现高风险漏洞时退出码为1')
    
    args = parser.parse_args()
    
    # 展开通配符
    all_files = []
    for pattern in args.results_files:
        files = glob.glob(pattern)
        if files:
            all_files.extend(files)
        else:
            all_files.append(pattern)  # 如果没有匹配，保留原始路径
    
    # 分析结果
    summary = analyze_zap_results(all_files)
    
    # 生成报告
    report = generate_security_report(summary)
    
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
        print(f"安全测试分析完成:")
        print(f"- 总告警数: {summary['total_alerts']}")
        print(f"- 高风险: {summary['high_risk_count']} 🔴")
        print(f"- 中风险: {summary['medium_risk_count']} 🟡")
        print(f"- 低风险: {summary['low_risk_count']} 🟢")
        print(f"- 信息性: {summary['info_risk_count']} 🔵")
        print(f"- 报告已保存到: {args.output}")
        print(f"- JSON 摘要已保存到: {args.json}")
    
    # 如果发现高风险漏洞且设置了 fail-on-high，退出码为 1
    if args.fail_on_high and summary['high_risk_count'] > 0:
        print(f"❌ 发现 {summary['high_risk_count']} 个高风险漏洞，测试失败")
        sys.exit(1)

if __name__ == '__main__':
    main()