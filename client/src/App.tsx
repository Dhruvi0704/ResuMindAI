import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/use-auth";
import { ResumeProvider } from "@/contexts/ResumeContext";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Home from "@/pages/Home";
import ResumeGenerator from "@/pages/ResumeGenerator";
import ResumeScreening from "@/pages/ResumeScreening";
import CVGenerator from "@/pages/CVGenerator";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import MockInterviewDashboard from "@/pages/Interview/MockInterviewDashboard";
import InterviewSession from "@/pages/Interview/InterviewSession";
import InterviewResult from "@/pages/Interview/InterviewResult";
import MyDocuments from "@/pages/MyDocuments";
import EngineTestRunner from "@/components/resume/engine/EngineTestRunner";
import Layout from "@/components/Layout";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/" component={Home} />
      <ProtectedRoute path="/resume-generator" component={ResumeGenerator} />
      <ProtectedRoute path="/resume-screening" component={ResumeScreening} />
      <ProtectedRoute path="/cv-generator" component={CVGenerator} />
      <ProtectedRoute path="/mock-interview" component={MockInterviewDashboard} />
      <ProtectedRoute path="/mock-interview/:id" component={InterviewSession} />
      <ProtectedRoute path="/mock-interview/:id/result" component={InterviewResult} />
      <ProtectedRoute path="/my-documents" component={MyDocuments} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/engine-test" component={EngineTestRunner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ResumeProvider>
          <TooltipProvider>
            <ThemeProvider>
              <Layout>
                <Toaster />
                <Router />
              </Layout>
            </ThemeProvider>
          </TooltipProvider>
        </ResumeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
