'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import axios from 'axios';
import { marked } from 'marked';

type AIDoc = {
  topic: string;
  content?: string;
  error?: string;
};

type AIOutput = {
  all_topics: string[];
  covered_topics: string[];
  gap_topics: string[];
  study_roadmap: string[];
};

type AiResourcesProps = {
  aiOutput?: AIOutput;
  topic?: string;
};

export const AiResources = ({ aiOutput: propAiOutput, topic }: AiResourcesProps) => {
  const [docs, setDocs] = useState<AIDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiOutput, setAiOutput] = useState<AIOutput | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('gapfinder_aiOutput');
    const parsed = stored ? JSON.parse(stored) : null;
    setAiOutput(propAiOutput || parsed);
  }, [propAiOutput]);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!aiOutput?.gap_topics?.length) return;
      setLoading(true);

      try {
        const response = await axios.post('https://backend-fawn-nine-74.vercel.app/generate-ai-docs', {
          topics: aiOutput.gap_topics,
        });

        const results: AIDoc[] = response.data.ai_documentation || [];

        const filtered = results.filter(
          (doc) =>
            doc.content &&
            doc.content !== '❌ No text in response parts.' &&
            !doc.error?.toLowerCase().includes('empty response')
        );

        setDocs(filtered);
      } catch (err) {
        console.error('Error fetching AI documentation:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [aiOutput]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">AI-Generated Resources</h2>
        <Lightbulb className="h-5 w-5 text-yellow-500" />
      </div>

      <p className="text-muted-foreground">
        Custom explanations generated for your knowledge gaps.
      </p>

      {loading && <p className="text-muted-foreground">Fetching AI resources...</p>}

      <div className="space-y-6">
        {docs.length > 0 ? (
          docs.map((doc, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-xl">{doc.topic}</CardTitle>
                <CardDescription>AI-generated explanation</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html: marked(doc.content || 'No content.'),
                  }}
                />
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && (
            <p className="text-muted-foreground">
              No high-quality AI resources available for the current topics.
            </p>
          )
        )}
      </div>
    </div>
  );
};
