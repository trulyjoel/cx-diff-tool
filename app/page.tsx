'use client';

import { useState } from 'react';

interface ScanConfig {
  config: {
    sast: {
      filter: any;
    };
  };
}

interface FormData {
  bearerToken: string;
  checkmarxProject: string;
  checkmarxScan1: string;
  checkmarxScan2: string;
  checkmarxBaseUrl: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    bearerToken: '',
    checkmarxProject: '',
    checkmarxScan1: '',
    checkmarxScan2: '',
    checkmarxBaseUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    scan1Config: any;
    scan2Config: any;
    differences: string[];
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchScanConfig = async (scanId: string): Promise<ScanConfig> => {
    const response = await fetch(`${formData.checkmarxBaseUrl}/api/scans/${scanId}/configuration`, {
      headers: {
        'Authorization': `Bearer ${formData.bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch scan ${scanId}: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  const compareFilters = (filter1: any, filter2: any): string[] => {
    const differences: string[] = [];
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      const keys1 = Object.keys(obj1 || {});
      const keys2 = Object.keys(obj2 || {});
      const allKeys = new Set([...keys1, ...keys2]);

      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];

        if (val1 === undefined && val2 !== undefined) {
          differences.push(`${currentPath}: Missing in Scan 1, present in Scan 2 (${JSON.stringify(val2)})`);
        } else if (val1 !== undefined && val2 === undefined) {
          differences.push(`${currentPath}: Present in Scan 1 (${JSON.stringify(val1)}), missing in Scan 2`);
        } else if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
          compareObjects(val1, val2, currentPath);
        } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          differences.push(`${currentPath}: Scan 1 = ${JSON.stringify(val1)}, Scan 2 = ${JSON.stringify(val2)}`);
        }
      }
    };

    compareObjects(filter1, filter2);
    return differences;
  };

  const handleAnalyze = async () => {
    if (!formData.bearerToken || !formData.checkmarxProject || !formData.checkmarxScan1 || !formData.checkmarxScan2 || !formData.checkmarxBaseUrl) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const [scan1Config, scan2Config] = await Promise.all([
        fetchScanConfig(formData.checkmarxScan1),
        fetchScanConfig(formData.checkmarxScan2)
      ]);

      const differences = compareFilters(
        scan1Config.config.sast.filter,
        scan2Config.config.sast.filter
      );

      setResults({
        scan1Config: scan1Config.config.sast.filter,
        scan2Config: scan2Config.config.sast.filter,
        differences
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching scan configurations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
          Checkmarx Scan Configuration Diff Tool
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="checkmarxBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Checkmarx Base URL
              </label>
              <input
                type="text"
                id="checkmarxBaseUrl"
                name="checkmarxBaseUrl"
                value={formData.checkmarxBaseUrl}
                onChange={handleInputChange}
                placeholder="https://your-checkmarx-instance.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="bearerToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bearer Token
              </label>
              <input
                type="password"
                id="bearerToken"
                name="bearerToken"
                value={formData.bearerToken}
                onChange={handleInputChange}
                placeholder="Enter your bearer token"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="checkmarxProject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Checkmarx Project
              </label>
              <input
                type="text"
                id="checkmarxProject"
                name="checkmarxProject"
                value={formData.checkmarxProject}
                onChange={handleInputChange}
                placeholder="Project ID or name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="checkmarxScan1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Checkmarx Scan 1 ID
              </label>
              <input
                type="text"
                id="checkmarxScan1"
                name="checkmarxScan1"
                value={formData.checkmarxScan1}
                onChange={handleInputChange}
                placeholder="First scan ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="md:col-span-1">
              <label htmlFor="checkmarxScan2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Checkmarx Scan 2 ID
              </label>
              <input
                type="text"
                id="checkmarxScan2"
                name="checkmarxScan2"
                value={formData.checkmarxScan2}
                onChange={handleInputChange}
                placeholder="Second scan ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Configuration Differences
              </h2>
              {results.differences.length === 0 ? (
                <p className="text-green-600 dark:text-green-400">
                  No differences found between the SAST filter configurations.
                </p>
              ) : (
                <ul className="space-y-2">
                  {results.differences.map((diff, index) => (
                    <li key={index} className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border-l-4 border-yellow-400">
                      {diff}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Scan 1 SAST Filter Configuration
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(results.scan1Config, null, 2)}
                </pre>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Scan 2 SAST Filter Configuration
                </h3>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(results.scan2Config, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
