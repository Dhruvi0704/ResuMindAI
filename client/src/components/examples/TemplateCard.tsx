import TemplateCard from "../TemplateCard";

export default function TemplateCardExample() {
  return (
    <div className="p-4 max-w-xs">
      <TemplateCard
        id="modern"
        name="Modern Professional"
        category="Tech & Engineering"
        isPremium={false}
        preview="Modern Resume Layout"
        onSelect={(id) => console.log("Template selected:", id)}
      />
    </div>
  );
}
