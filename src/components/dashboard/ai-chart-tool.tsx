'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { suggestChartFields } from '@/ai/flows/dynamic-chart-suggestions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '../ui/card';

const formSchema = z.object({
  outcome: z.string().min(10, {
    message: "Please describe the outcome in at least 10 characters.",
  }),
});

const availableFields = [
  'BeerSales', 'SalesSubTotal', 'Discounts', 'Covers', 'Entrees', 'ToGo', 'WebTotal',
  'FoundationDonations', 'total_labor_dollars', 'total_labor_hours', 'FoodCostPercent',
  'LiquorCostPercent', 'BeerCostPercent', 'AlcoholCostPercent', 'MarketingSpend', 'Weather',
  'LocalEvents'
];

export function AiChartTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ suggestedFields: string[]; reasoning: string } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outcome: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await suggestChartFields({
        outcome: values.outcome,
        availableFields: availableFields,
      });
      setResult(response);
    } catch (error) {
      console.error("AI suggestion failed:", error);
      // TODO: show a toast notification here
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="outcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Outcome</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., 'A significant drop in net sales over the last quarter'"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Get Suggestions
          </Button>
        </form>
      </Form>

      {result && (
        <Card className="mt-4 bg-background/50">
            <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">Suggested Fields:</p>
                <div className="flex flex-wrap gap-2 mb-3">
                    {result.suggestedFields.map(field => (
                        <Badge key={field} variant="secondary">{field}</Badge>
                    ))}
                </div>
                <p className="text-sm font-semibold mb-2">Reasoning:</p>
                <p className="text-sm text-muted-foreground">{result.reasoning}</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
