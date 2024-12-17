import React from "'react'"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Briefcase, Users, Clock } from "'lucide-react'"
import { Scenario } from "'../types/scenario'"

interface SidebarProps {
  scenarios: Scenario[];
  onSelectScenario: (scenario: Scenario) => void;
  selectedScenario: Scenario | null;
}

const Sidebar: React.FC<SidebarProps> = ({ scenarios, onSelectScenario, selectedScenario }) => {
  return (
    <div className="w-72 bg-gray-100 p-4 h-screen border-r border-gray-200 shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-green-700 text-center">Scenarios</h2>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {scenarios.map((scenario) => (
          <Card 
            key={scenario.id} 
            className={`mb-4 overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
              selectedScenario?.id === scenario.id ? "'ring-2 ring-green-500'" : "''"
            }`}
          >
            <CardContent className="p-4">
              <Button
                className="text-left p-0 h-auto hover:bg-transparent w-full flex flex-col items-start"
                variant="ghost"
                onClick={() => onSelectScenario(scenario)}
              >
                <div className="space-y-2 w-full">
                  <h3 className={`font-semibold text-base ${
                    selectedScenario?.id === scenario.id ? "'text-green-600'" : "'text-gray-700'"
                  }`}>
                    {scenario.heading}
                  </h3>
                  <div className="flex items-center text-xs text-gray-600 w-full">
                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{scenario.personName}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 w-full">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{scenario.age} years old</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 w-full">
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{scenario.ethnicity}</span>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )
}

export default Sidebar

