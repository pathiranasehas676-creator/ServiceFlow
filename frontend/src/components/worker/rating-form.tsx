'use client';

import { useState } from 'react';
import { useRating } from '@/lib/hooks/worker/use-rating';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RatingForm({ jobId }: { jobId: string }) {
    const { rate, isRating } = useRating(jobId);
    const [score, setScore] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (score === 0) return alert("Please select a rating");
        rate({ score, comment });
    };

    return (
        <Card className="border-none shadow-sm bg-slate-50/50">
            <CardHeader>
                <CardTitle className="text-lg font-bold">Rate your experience</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                className="focus:outline-none transition-transform hover:scale-110"
                                onClick={() => setScore(s)}
                                onMouseEnter={() => setHover(s)}
                                onMouseLeave={() => setHover(0)}
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        (hover || score) >= s ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Feedback (Optional)</label>
                        <Textarea
                            placeholder="How was the job? Any issues or highlights?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-white border-slate-200 min-h-[100px] rounded-xl"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isRating || score === 0}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12 rounded-xl shadow-lg shadow-indigo-200"
                    >
                        {isRating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                        SUBMIT RATING
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
