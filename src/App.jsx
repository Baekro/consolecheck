 //@BAESIKDANG
import React, { useState } from 'react';

export default function ConsoleLogRemover() {
  const [activeTab, setActiveTab] = useState('remove');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({ removed: 0, lines: 0 });
  
  // 그룹화 옵션
  const [groupOptions, setGroupOptions] = useState({
    groupName: 'Debug Group',
    color: 'blue',
    addTimestamp: false,
    collapseGroup: false
  });

  const removeConsoleLogs = (code) => {
    if (!code.trim()) {
      setOutput('');
      setStats({ removed: 0, lines: 0 });
      return;
    }

    let removedCount = 0;
    const lines = code.split('\n');
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // console 메서드 패턴 (멀티라인 지원하게)
      const consolePattern = /^console\.(log|warn|error|info|debug|table|dir|trace|group|groupCollapsed|groupEnd)\s*\(/;
      
      if (consolePattern.test(trimmed)) {
        removedCount++;
        
        // 괄호 균형 체크 - 완전한 console 문이 닫힐 때까지 스킵
        let openParens = (line.match(/\(/g) || []).length;
        let closeParens = (line.match(/\)/g) || []).length;
        
        // 한 줄에 완성되지 않은 경우 다음 줄들도 체크
        while (openParens > closeParens && i + 1 < lines.length) {
          i++;
          const nextLine = lines[i];
          openParens += (nextLine.match(/\(/g) || []).length;
          closeParens += (nextLine.match(/\)/g) || []).length;
        }
        
        i++;
        continue;
      }
      
      // 이미 주석처리된 console.log도 제거
      if (/^\/\/\s*console\./.test(trimmed)) {
        removedCount++;
        i++;
        continue;
      }
      
      result.push(line);
      i++;
    }

    const cleaned = result.join('\n');
    setOutput(cleaned);
    setStats({ 
      removed: removedCount, 
      lines: lines.length 
    });
  };

  const organizeConsoleLogs = (code) => {
    if (!code.trim()) {
      setOutput('');
      setStats({ removed: 0, lines: 0 });
      return;
    }

    let organizedCount = 0;
    const lines = code.split('\n');
    const result = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // console.log 패턴 (멀티라인 지원)
      if (/^console\.log\s*\(/.test(trimmed)) {
        organizedCount++;
        const indent = line.match(/^\s*/)[0];
        
        // 괄호 균형 체크
        let openParens = (line.match(/\(/g) || []).length;
        let closeParens = (line.match(/\)/g) || []).length;
        let fullStatement = line;
        
        // 멀티라인 console.log 수집
        while (openParens > closeParens && i + 1 < lines.length) {
          i++;
          fullStatement += '\n' + lines[i];
          openParens += (lines[i].match(/\(/g) || []).length;
          closeParens += (lines[i].match(/\)/g) || []).length;
        }
        
        // 주석처리 (멀티라인인 경우 /* */ 사용)
        if (fullStatement.includes('\n')) {
          result.push(`${indent}/* ${fullStatement.trim()} */`);
        } else {
          result.push(`${indent}// ${trimmed}`);
        }
        
        i++;
        continue;
      }
      
      result.push(line);
      i++;
    }

    const organized = result.join('\n');
    setOutput(organized);
    setStats({ 
      removed: organizedCount, 
      lines: lines.length 
    });
  };

  const groupifyConsoleLogs = (code) => {
    if (!code.trim()) {
      setOutput('');
      setStats({ removed: 0, lines: 0 });
      return;
    }

    const { groupName, color, addTimestamp, collapseGroup } = groupOptions;
    let groupedCount = 0;
    const lines = code.split('\n');
    const result = [];
    let i = 0;
    
    // 색상 코드 매핑
    const colorCodes = {
      blue: 'color: #3b82f6; font-weight: bold;',
      green: 'color: #10b981; font-weight: bold;',
      red: 'color: #ef4444; font-weight: bold;',
      yellow: 'color: #f59e0b; font-weight: bold;',
      purple: 'color: #a855f7; font-weight: bold;',
      cyan: 'color: #06b6d4; font-weight: bold;'
    };
    
    let insideConsoleBlock = false;
    let firstConsoleFound = false;
    
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // console.log 패턴 감지
      if (/^console\.log\s*\(/.test(trimmed)) {
        // 첫 번째 console.log 발견 시 그룹 시작
        if (!firstConsoleFound) {
          const indent = line.match(/^\s*/)[0];
          const groupMethod = collapseGroup ? 'groupCollapsed' : 'group';
          result.push(`${indent}console.${groupMethod}('%c${groupName}', '${colorCodes[color]}');`);
          if (addTimestamp) {
            result.push(`${indent}console.log('%c⏰ ' + new Date().toLocaleTimeString(), 'color: #9ca3af;');`);
          }
          firstConsoleFound = true;
          insideConsoleBlock = true;
        }
        
        groupedCount++;
        
        // 기존 console.log에 스타일 추가
        const indent = line.match(/^\s*/)[0];
        let openParens = (line.match(/\(/g) || []).length;
        let closeParens = (line.match(/\)/g) || []).length;
        let fullStatement = line;
        
        // 멀티라인 수집
        while (openParens > closeParens && i + 1 < lines.length) {
          i++;
          fullStatement += '\n' + lines[i];
          openParens += (lines[i].match(/\(/g) || []).length;
          closeParens += (lines[i].match(/\)/g) || []).length;
        }
        
        result.push(fullStatement);
        i++;
        continue;
      }
      
      // console.log가 아닌 코드가 나오면 그룹 종료
      if (firstConsoleFound && insideConsoleBlock && trimmed && !/^console\./.test(trimmed)) {
        const indent = line.match(/^\s*/)[0];
        result.push(`${indent}console.groupEnd();`);
        result.push('');
        insideConsoleBlock = false;
      }
      
      result.push(line);
      i++;
    }
    
    // 마지막에 그룹이 열려있으면 닫기
    if (insideConsoleBlock) {
      result.push('console.groupEnd();');
    }

    const grouped = result.join('\n');
    setOutput(grouped);
    setStats({ 
      removed: groupedCount, 
      lines: lines.length 
    });
  };

  const handleProcess = (code) => {
    if (activeTab === 'remove') {
      removeConsoleLogs(code);
    } else if (activeTab === 'organize') {
      organizeConsoleLogs(code);
    } else {
      groupifyConsoleLogs(code);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setStats({ removed: 0, lines: 0 });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (input) {
      if (tab === 'remove') {
        removeConsoleLogs(input);
      } else if (tab === 'organize') {
        organizeConsoleLogs(input);
      } else {
        groupifyConsoleLogs(input);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
           
        
            <div>
              <h1 className="text-2xl font-bold text-white">
                Console Log Manager
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">개발용 콘솔 로그 관리 도구</p>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleTabChange('remove')}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'remove'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                콘솔로그 삭제
              </div>
            </button>
            <button
              onClick={() => handleTabChange('organize')}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'organize'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M7 7L5 5M17 7L19 5M7 17L5 19M17 17L19 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                주석처리
              </div>
            </button>
            <button
              onClick={() => handleTabChange('groupify')}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === 'groupify'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                그룹화
              </div>
            </button>
          </div>
          
          {/* Group Options */}
          {activeTab === 'groupify' && (
            <div className="mt-4 p-4 rounded-lg bg-slate-800 border border-slate-700">
              <h3 className="text-slate-300 font-semibold text-sm mb-3">그룹 설정</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">그룹 이름</label>
                  <input
                    type="text"
                    value={groupOptions.groupName}
                    onChange={(e) => setGroupOptions({...groupOptions, groupName: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Debug Group"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">색상</label>
                  <select
                    value={groupOptions.color}
                    onChange={(e) => setGroupOptions({...groupOptions, color: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="blue">파랑</option>
                    <option value="green">초록</option>
                    <option value="red">빨강</option>
                    <option value="yellow">노랑</option>
                    <option value="purple">보라</option>
                    <option value="cyan">청록</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">옵션</label>
                  <div className="flex items-center gap-2 h-[38px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupOptions.addTimestamp}
                        onChange={(e) => setGroupOptions({...groupOptions, addTimestamp: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-300">타임스탬프</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">표시방식</label>
                  <div className="flex items-center gap-2 h-[38px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupOptions.collapseGroup}
                        onChange={(e) => setGroupOptions({...groupOptions, collapseGroup: e.target.checked})}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs text-slate-300">접힌 상태</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Stats */}
          {stats.removed > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2 text-emerald-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-semibold">
                    {stats.removed}개 {activeTab === 'remove' ? '제거됨' : activeTab === 'organize' ? '주석처리됨' : '그룹화됨'}
                  </span>
                </div>
                {activeTab === 'remove' && (
                  <>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <span className="text-slate-300">
                      {stats.lines}줄 → {stats.lines - stats.removed}줄
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h2 className="font-semibold">원본 코드</h2>
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all text-xs font-medium flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                초기화
              </button>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleProcess(e.target.value);
              }}
              placeholder={`여기에 코드를 붙여넣으세요...

예시:
function example() {
  console.log('디버깅 로그');
  console.log(
    '멀티라인',
    '콘솔로그도',
    '처리됩니다'
  );
  const data = getData();
  console.warn('경고');
  return data;
}`}
              className="w-full h-[550px] bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-700 placeholder:text-slate-600 shadow-xl"
              spellCheck="false"
            />
          </div>

          {/* Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="font-semibold">처리된 코드</h2>
              </div>
              {output && (
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-all text-xs font-medium flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      복사완료
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      복사
                    </>
                  )}
                </button>
              )}
            </div>
            
            <pre className="w-full h-[550px] bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-sm overflow-auto border border-slate-700 shadow-xl whitespace-pre-wrap break-words">
              {output || (
                <span className="text-slate-500">
                  왼쪽에 코드를 입력하면 결과가 여기에 표시됩니다
                </span>
              )}
            </pre>
          </div>
        </div>

        {/* Info Panel */}
        <div className="mt-6 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-400 font-semibold mb-3 text-sm">
                {activeTab === 'remove' 
                  ? '완전히 제거되는 패턴' 
                  : activeTab === 'organize' 
                  ? '주석처리되는 패턴'
                  : '그룹화 기능 설명'}
              </h3>
              <div className="space-y-3">
                {activeTab === 'remove' && (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        'console.log()',
                        'console.warn()',
                        'console.error()',
                        'console.info()',
                        'console.debug()',
                        'console.table()',
                        'console.dir()',
                        'console.trace()',
                      ].map((pattern, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          <code className="text-emerald-400">{pattern}</code>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">개선사항:</div>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>• 멀티라인 console.log 완전 제거</div>
                        <div>• 이모지 포함 console.log 완전 제거</div>
                        <div>• 괄호 균형 체크로 정확한 제거</div>
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === 'organize' && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span>console.log()를 주석처리 (들여쓰기 유지)</span>
                    </div>
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">예시:</div>
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-slate-500">// console.log('한줄');</div>
                        <div className="text-slate-500">/* console.log('멀티', '라인') */</div>
                        <div className="text-slate-300 mt-2">const data = getData();</div>
                      </div>
                    </div>
                  </>
                )}
                
                {activeTab === 'groupify' && (
                  <div className="space-y-3">
                    <div className="text-xs text-slate-300">
                      연속된 console.log를 그룹으로 묶고 색상을 지정합니다.
                    </div>
                    <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">예시 출력:</div>
                      <div className="font-mono text-xs space-y-1">
                        <div className="text-blue-400">console.group('%cDebug Group', 'color: #3b82f6; font-weight: bold;');</div>
                        <div className="text-slate-500">  console.log('디버깅 1');</div>
                        <div className="text-slate-500">  console.log('디버깅 2');</div>
                        <div className="text-blue-400">console.groupEnd();</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mt-0.5">
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>브라우저 콘솔에서 색상과 그룹이 표시됩니다</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}