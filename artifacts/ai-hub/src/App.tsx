import { Layout } from "./components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import People from "@/pages/people";
import PersonDetail from "@/pages/person-detail";
import Sources from "@/pages/sources";
import Communities from "@/pages/communities";
import NotFound from "@/pages/not-found";
import Feed from "@/pages/feed";
import AgiTracker from "@/pages/agi-tracker";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/people" component={People} />
        <Route path="/people/:id" component={PersonDetail} />
        <Route path="/agi" component={AgiTracker} />
        <Route path="/feed" component={Feed} />
        <Route path="/sources" component={Sources} />
        <Route path="/communities" component={Communities} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
