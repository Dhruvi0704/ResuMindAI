import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, Building2, MapPin, ExternalLink, Loader2, Sparkles, MapPinned } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { JobRecommendation } from '../../../../shared/jobTypes';

interface RecommendedJobsProps {
    resumeText: string;
}

const PLATFORMS = ["All", "Adzuna", "JSearch", "Jooble"];
const INDIAN_CITIES = [
    "All India", "Mumbai", "Pune", "Bangalore", "Hyderabad", "Chennai", 
    "Delhi", "Noida", "Gurgaon", "Kolkata", "Ahmedabad", "Remote India"
];

export default function RecommendedJobs({ resumeText }: RecommendedJobsProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string>("All");
    const [selectedLocation, setSelectedLocation] = useState<string>("All India");

    const { data, isLoading, error } = useQuery({
        queryKey: ['jobRecommendations', resumeText.substring(0, 100), selectedLocation], 
        queryFn: async () => {
            const res = await apiRequest("POST", "/api/jobs/recommendations", { resumeText, location: selectedLocation === "All India" ? "" : selectedLocation });
            const json = await res.json();
            return {
                extractedProfile: json.extractedProfile,
                recommendations: json.recommendations as JobRecommendation[],
            };
        },
        enabled: !!resumeText && resumeText.length > 50, // Only fetch if we have some reasonable text
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    if (isLoading) {
        return (
            <div className="w-full py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">AI is analyzing your profile to find the best job matches...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-muted-foreground">
                    Unable to load job recommendations at this time.
                </CardContent>
            </Card>
        );
    }

    const { extractedProfile, recommendations } = data;

    const filteredJobs = recommendations.filter(job =>
        selectedPlatform === "All" ? true : job.platform === selectedPlatform
    );

    return (
        <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        AI Found Jobs Matching Your Profile
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Based on your {extractedProfile.experienceLevel} {extractedProfile.jobRoles[0]} experience.
                    </p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-lg border">
                {/* Platform Filters */}
                <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map(platform => (
                        <Badge
                            key={platform}
                            variant={selectedPlatform === platform ? "default" : "outline"}
                            className="cursor-pointer text-sm px-3 py-1 hover:bg-primary/90 hover:text-primary-foreground transition-colors"
                            onClick={() => setSelectedPlatform(platform)}
                        >
                            {platform}
                        </Badge>
                    ))}
                </div>

                {/* Location Filter */}
                <div className="flex items-center gap-2">
                    <MapPinned className="w-4 h-4 text-muted-foreground" />
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                        <SelectContent>
                            {INDIAN_CITIES.map(city => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobs.length === 0 ? (
                    <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
                        <p className="text-muted-foreground">No jobs found for the selected platform.</p>
                        <Button variant="ghost" className="text-primary hover:underline" onClick={() => setSelectedPlatform("All")}>
                            View all jobs
                        </Button>
                    </div>
                ) : (
                    filteredJobs.map((job) => (
                        <Card key={job.id} className="group hover:border-primary/50 transition-colors flex flex-col h-full hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg line-clamp-1">{job.title}</CardTitle>
                                        <CardDescription className="flex items-center gap-1 font-medium text-foreground">
                                            <Building2 className="w-3 h-3" />
                                            {job.company}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
                                        {job.matchScore}% Match
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-3 flex-grow space-y-4">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {job.platform}
                                    </span>
                                </div>
                                <p className="text-sm line-clamp-2 text-muted-foreground">
                                    {job.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {job.requiredSkills.slice(0, 4).map(skill => (
                                        <Badge key={skill} variant="outline" className="text-xs font-normal">
                                            {skill}
                                        </Badge>
                                    ))}
                                    {job.requiredSkills.length > 4 && (
                                        <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                            +{job.requiredSkills.length - 4} more
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0 justify-between items-center border-t mt-4 mb-2 mx-4 gap-4">
                                <div className="text-xs text-muted-foreground pt-4">
                                    Requested via {job.platform}
                                </div>
                                <Button size="sm" className="gap-1 mt-4 group-hover:-translate-y-0.5 transition-transform" onClick={() => window.open(job.url, '_blank')}>
                                    Apply Now
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
