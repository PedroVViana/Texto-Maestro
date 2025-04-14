"use client";

import {RewriteTextInput, rewriteText} from "@/ai/flows/rewrite-text";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {useToast} from "@/hooks/use-toast";
import {Copy, Download} from "lucide-react";

const rewriteStyles = [
  "Grammar correction",
  "Formal rewrite",
  "Simplified rewrite",
  "Persuasive rewrite",
  "Social media optimization",
] as const;

export default function Home() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState(rewriteStyles[0]);
  const [rewrittenText, setRewrittenText] = useState("");
  const [loading, setLoading] = useState(false);
  const {toast} = useToast();

  const handleRewrite = async () => {
    setLoading(true);
    try {
      const input: RewriteTextInput = {
        text: text,
        style: style,
      };
      const result = await rewriteText(input);
      setRewrittenText(result.rewrittenText);
      toast({
        title: "Text Rewritten",
        description: "Successfully rewritten the text.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to rewrite text.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenText);
    toast({
      title: "Copied!",
      description: "Rewritten text copied to clipboard.",
    });
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([rewrittenText], {
      type: "text/plain",
    });
    element.href = URL.createObjectURL(file);
    element.download = "rewritten_text.txt";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background p-4">
      <Card className="w-full max-w-2xl p-4">
        <CardHeader>
          <CardTitle>Texto Maestro</CardTitle>
          <CardDescription>Enter the text you want to rewrite.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Textarea
              placeholder="Enter your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Select onValueChange={value => setStyle(value as RewriteTextInput["style"])}>
              <SelectTrigger>
                <SelectValue placeholder={style}/>
              </SelectTrigger>
              <SelectContent>
                {rewriteStyles.map((styleOption) => (
                  <SelectItem key={styleOption} value={styleOption}>
                    {styleOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRewrite} disabled={loading} className="bg-accent text-white">
            {loading ? "Generating..." : "Generate Text"}
          </Button>
        </CardContent>
      </Card>

      {rewrittenText && (
        <Card className="w-full max-w-2xl mt-6 p-4">
          <CardHeader>
            <CardTitle>Rewritten Text</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="whitespace-pre-line">{rewrittenText}</div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="icon" onClick={handleCopy}>
                <Copy className="h-4 w-4"/>
                <span className="sr-only">Copy</span>
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="h-4 w-4"/>
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
