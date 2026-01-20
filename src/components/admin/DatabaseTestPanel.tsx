import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { databaseTester } from '@/tests/databaseTest';
import { Database, CheckCircle, XCircle, Loader2, Play, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TestResult {
  name: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  duration?: number;
}

export const DatabaseTestPanel = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  } | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setSummary(null);

    try {
      const result = await databaseTester.runAllTests();
      if (result) {
        setTestResults(result.results);
        setSummary({
          total: result.total,
          passed: result.passed,
          failed: result.failed,
          skipped: result.skipped,
          duration: result.duration,
        });
      }
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-500" />
          <div>
            <h2 className="text-xl font-bold">Database Test Suite</h2>
            <p className="text-sm text-muted-foreground">
              Test Firebase Auth, Firestore, and Storage operations
            </p>
          </div>
        </div>
        <Button
          onClick={runTests}
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run All Tests
            </>
          )}
        </Button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-5 gap-4">
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-xs text-muted-foreground">Total Tests</div>
          </div>
          <div className="glass-panel p-4 text-center border-green-500/30">
            <div className="text-2xl font-bold text-green-500">{summary.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="glass-panel p-4 text-center border-red-500/30">
            <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="glass-panel p-4 text-center border-gray-500/30">
            <div className="text-2xl font-bold text-gray-500">{summary.skipped}</div>
            <div className="text-xs text-muted-foreground">Skipped</div>
          </div>
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl font-bold">{summary.duration}ms</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="glass-panel">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold">Test Results</h3>
          </div>
          <div className="divide-y divide-white/5">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 flex items-start gap-3 transition-colors',
                  result.status === 'failed' && 'bg-red-500/5',
                  result.status === 'success' && 'hover:bg-green-500/5'
                )}
              >
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm">{result.name}</h4>
                    {result.duration && (
                      <span className="text-xs text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    'text-sm mt-1',
                    result.status === 'failed' ? 'text-red-400' : 'text-muted-foreground'
                  )}>
                    {result.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      {!isRunning && testResults.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Tests Run Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click "Run All Tests" to verify database operations
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>✓ Firebase Authentication</div>
            <div>✓ Firestore Database (CRUD)</div>
            <div>✓ Storage Services</div>
            <div>✓ User Management</div>
            <div>✓ Vehicle Operations</div>
          </div>
        </div>
      )}
    </div>
  );
};
