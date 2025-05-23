'use client';

import { useEffect, useState } from 'react';
import { marked } from 'marked';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { FileText, Youtube, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

type Video = {
  topic: string;
  title: string;
  channel: string;
  videoId: string;
  url: string;
  thumbnail: string;
};

type Documentation = {
  topic: string;
  github: {
    repo: string;
    url: string;
  } | null;
  devdocs: string;
  readme: string | null;
  error?: string;
};

type RoadmapStep = {
  step: number; // changed from 'stage'
  title: string;
  topics: string[];
  resources: string[];
};


type AIOutput = {
  all_topics: string[];
  covered_topics: string[];
  gap_topics: string[];
};

export const ResourcesSection = ({
  topic: propTopic,
  aiOutput: propAiOutput,
}: {
  topic?: string;
  aiOutput?: AIOutput;
}) => {
  const [topic, setTopic] = useState<string>('');
  const [aiOutput, setAiOutput] = useState<AIOutput | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTopic = localStorage.getItem('gapfinder_topic');
    const storedAiOutput = localStorage.getItem('gapfinder_aiOutput');

    const parsedOutput: AIOutput | null =
      storedAiOutput && typeof storedAiOutput === 'string'
        ? JSON.parse(storedAiOutput)
        : null;

    setTopic(propTopic || storedTopic || '');
    setAiOutput(propAiOutput || parsedOutput || null);
  }, [propTopic, propAiOutput]);

  useEffect(() => {
    const fetchAllResources = async () => {
      if (!aiOutput || !aiOutput.gap_topics?.length) return;
      setLoading(true);
      try {
        const topics = aiOutput.gap_topics;

        const [videosRes, docsRes, roadmapRes] = await Promise.all([
          axios.post('https://backend-fawn-nine-74.vercel.app/getvideos', { topics, max: 2 }),
          axios.post('https://backend-fawn-nine-74.vercel.app/fetch-docs', { topics }),
          axios.post('https://backend-fawn-nine-74.vercel.app/generate-study-roadmap', { topics }),
        ]);

        setVideos(videosRes.data || []);
        setDocs(docsRes.data.documentation || []);
        setRoadmap(roadmapRes.data.roadmap || []);
      } catch (err) {
        console.error('Error fetching resources:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllResources();
  }, [aiOutput]);

  if (!aiOutput)
    return (
      <div className="text-muted-foreground">
        Loading personalized resources...
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Learning Resources</h2>
        <p className="text-muted-foreground">
          Tailored content based on your current knowledge gaps.
        </p>
      </div>

      <Tabs defaultValue="articles">
        <TabsList className="mb-4">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Articles
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" /> Videos
          </TabsTrigger>
          <TabsTrigger value="roadmaps" className="flex items-center gap-2">
            <Book className="h-4 w-4" /> Roadmaps
          </TabsTrigger>
        </TabsList>

        {/* Articles */}
        <TabsContent value="articles" className="space-y-4">
          {docs.map((doc, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{doc.topic}</CardTitle>
                <CardDescription>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2">
                    {doc.github && (
                      <a
                        href={doc.github.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-sm text-blue-500"
                      >
                        GitHub: {doc.github.repo}
                      </a>
                    )}
                    <a
                      href={doc.devdocs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-sm text-blue-500"
                    >
                      DevDocs
                    </a>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: doc.readme
                      ? marked(doc.readme)
                      : '<div>No README available.</div>',
                  }}
                />
              </CardContent>
              {doc.github && (
                <CardFooter>
                  <Button variant="outline" asChild>
                    <a
                      href={doc.github.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Explore on GitHub
                    </a>
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos" className="space-y-4">
          {videos.map((video, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{video.title}</CardTitle>
                <CardDescription>By {video.channel}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full max-w-2xl">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${video.videoId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              </CardContent>
            </Card>
          ))}
          {videos.length === 0 && !loading && (
            <p className="text-muted-foreground">
              No videos found for the selected topics.
            </p>
          )}
        </TabsContent>

        {/* Roadmaps */}
        {/* Roadmaps */}
<TabsContent value="roadmaps" className="space-y-4">
  {roadmap.map((step: RoadmapStep, index: number) => (
    <Card key={index}>
      <CardHeader>
        <CardTitle>
          Step {step.step}: {step.title}
        </CardTitle>
        <CardDescription>
          Topics: {step.topics.join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {step.resources.length > 0 && (
          <div className="space-y-1">
            <h4 className="font-semibold">Resources:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {step.resources.map((url: string, i: number) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  ))}
  {roadmap.length === 0 && !loading && (
    <p className="text-muted-foreground">
      No roadmap available for these topics.
    </p>
  )}
</TabsContent>

      </Tabs>
    </div>
  );
};
