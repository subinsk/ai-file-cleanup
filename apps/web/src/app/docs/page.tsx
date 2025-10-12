'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface DocFile {
  name: string;
  title: string;
  order: number;
  content?: string;
}

const docs: DocFile[] = [
  { name: '00-architecture', title: 'Architecture', order: 0 },
  { name: '01-prerequisites', title: 'Prerequisites', order: 1 },
  { name: '02-installation', title: 'Installation', order: 2 },
  { name: '03-environment-setup', title: 'Environment Setup', order: 3 },
  { name: '04-database-setup', title: 'Database Setup', order: 4 },
  { name: '05-running-project', title: 'Running Project', order: 5 },
  { name: '06-deployment', title: 'Deployment', order: 6 },
];

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState(docs[0]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    loadDoc(selectedDoc.name);
  }, [selectedDoc]);

  const loadDoc = async (docName: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/docs/${docName}`);
      const data = await response.json();
      setContent(data.content);
    } catch (error) {
      setContent('# Error\n\nFailed to load documentation.');
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (order: number) => {
    setCompletedSteps((prev) =>
      prev.includes(order) ? prev.filter((s) => s !== order) : [...prev, order].sort()
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documentation</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Step-by-step guide to set up and run the project
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Setup Steps</h2>
              <nav className="space-y-2">
                {docs.map((doc) => (
                  <button
                    key={doc.name}
                    onClick={() => setSelectedDoc(doc)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between gap-2 ${
                      selectedDoc.name === doc.name
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completedSteps.includes(doc.order)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {completedSteps.includes(doc.order) ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-medium">{doc.order}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{doc.title}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        selectedDoc.name === doc.name ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </button>
                ))}
              </nav>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Progress</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(completedSteps.length / docs.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {completedSteps.length}/{docs.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {/* Mark as complete button */}
                  <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Step {selectedDoc.order} of {docs.length}
                      </span>
                    </div>
                    <button
                      onClick={() => toggleComplete(selectedDoc.order)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        completedSteps.includes(selectedDoc.order)
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {completedSteps.includes(selectedDoc.order) ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 inline mr-2" />
                          Completed
                        </>
                      ) : (
                        'Mark as Complete'
                      )}
                    </button>
                  </div>

                  {/* Markdown Content */}
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                            {children}
                          </p>
                        ),
                        pre: ({ children, ...props }) => (
                          <pre
                            className="!bg-gray-900 dark:!bg-black rounded-lg overflow-x-auto my-4 p-4 !text-gray-100"
                            style={{ color: '#f3f4f6' }}
                            {...props}
                          >
                            {children}
                          </pre>
                        ),
                        code: ({
                          inline,
                          className,
                          children,
                          ...props
                        }: React.HTMLAttributes<HTMLElement> & {
                          inline?: boolean;
                          className?: string;
                          children?: React.ReactNode;
                        }) => {
                          // Syntax highlighted block code
                          if (className?.includes('language-')) {
                            return (
                              <code
                                className={`${className} text-sm font-mono`}
                                style={{ color: '#f3f4f6' }}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          // Plain block code (no language, inside pre) - check if multiline
                          const isMultiline =
                            typeof children === 'string' && children.includes('\n');
                          if (inline === false || isMultiline) {
                            return (
                              <code
                                className="text-sm font-mono"
                                style={{ color: '#f3f4f6' }}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          // Default to inline code (single line, no language class)
                          return (
                            <code
                              className="px-1.5 py-0.5 rounded text-sm font-mono font-semibold"
                              style={{
                                backgroundColor: '#e5e7eb',
                                color: '#dc2626',
                                border: '1px solid #d1d5db',
                              }}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-gray-700 dark:text-gray-300">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900 dark:text-white">
                            {children}
                          </strong>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>

                  {/* Navigation Buttons */}
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      {selectedDoc.order > 0 && (
                        <button
                          onClick={() => setSelectedDoc(docs[selectedDoc.order - 1])}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          ← Previous: {docs[selectedDoc.order - 1].title}
                        </button>
                      )}
                    </div>
                    <div>
                      {selectedDoc.order < docs.length - 1 && (
                        <button
                          onClick={() => setSelectedDoc(docs[selectedDoc.order + 1])}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Next: {docs[selectedDoc.order + 1].title} →
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
