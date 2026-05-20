import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface TemplateCardProps {
  id: string;
  name: string;
  category: string;
  isPremium: boolean;
  preview: string;
  onSelect: (id: string) => void;
}

export default function TemplateCard({ id, name, category, isPremium, preview, onSelect }: TemplateCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2 transition-all duration-300 hover:-translate-y-1" data-testid={`card-template-${id}`}>
      <div className="relative aspect-[8.5/11] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full h-full bg-background/80 backdrop-blur rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <span className="text-sm text-muted-foreground">{preview}</span>
          </div>
        </div>
        {isPremium && (
          <Badge className="absolute top-3 right-3 bg-chart-4 text-foreground gap-1">
            <Crown className="w-3 h-3" />
            Premium
          </Badge>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1" data-testid={`text-template-name-${id}`}>{name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{category}</p>
        <Button 
          onClick={() => onSelect(id)} 
          className="w-full"
          data-testid={`button-select-template-${id}`}
        >
          Select Template
        </Button>
      </div>
    </Card>
  );
}
