'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// CVSS v3.1 Metric Values
const metrics = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: { N: 0.85, L: 0.62, H: 0.27 }, // Scope Unchanged
  PR_C: { N: 0.85, L: 0.68, H: 0.5 }, // Scope Changed
  UI: { N: 0.85, R: 0.62 },
  C: { H: 0.56, L: 0.22, N: 0 },
  I: { H: 0.56, L: 0.22, N: 0 },
  A: { H: 0.56, L: 0.22, N: 0 },
};

type CvssFormValues = {
  AV: keyof typeof metrics.AV;
  AC: keyof typeof metrics.AC;
  PR: keyof typeof metrics.PR;
  UI: keyof typeof metrics.UI;
  S: 'U' | 'C';
  C: keyof typeof metrics.C;
  I: keyof typeof metrics.I;
  A: keyof typeof metrics.A;
};

const defaultValues: CvssFormValues = {
  AV: 'N',
  AC: 'L',
  PR: 'N',
  UI: 'N',
  S: 'U',
  C: 'N',
  I: 'N',
  A: 'N',
};

const roundup = (value: number) => Math.ceil(value * 10) / 10;

const getScoreColor = (score: number): 'destructive' | 'secondary' | 'default' | 'outline' => {
  if (score >= 9.0) return 'destructive';
  if (score >= 7.0) return 'destructive'; // High should also be prominent
  if (score >= 4.0) return 'secondary'; // Medium
  if (score > 0) return 'default'; // Low
  return 'outline'; // None
};

const getSeverity = (score: number): string => {
  if (score >= 9.0) return 'Critical';
  if (score >= 7.0) return 'High';
  if (score >= 4.0) return 'Medium';
  if (score > 0) return 'Low';
  return 'None';
};

export function CvssCalculator() {
  const [score, setScore] = useState(0.0);
  const form = useForm<CvssFormValues>({ defaultValues });

  const calculateScore = (values: CvssFormValues) => {
    const scopeChanged = values.S === 'C';
    const privsRequired = scopeChanged ? metrics.PR_C[values.PR] : metrics.PR[values.PR];

    const impactSubScore = 1 - (1 - metrics.C[values.C]) * (1 - metrics.I[values.I]) * (1 - metrics.A[values.A]);
    
    if (impactSubScore <= 0) {
      setScore(0.0);
      return;
    }

    const exploitabilitySubScore = 8.22 * metrics.AV[values.AV] * metrics.AC[values.AC] * privsRequired * metrics.UI[values.UI];

    let baseScore;
    if (!scopeChanged) {
      baseScore = roundup(Math.min(impactSubScore + exploitabilitySubScore, 10));
    } else {
      baseScore = roundup(Math.min(1.08 * (impactSubScore + exploitabilitySubScore), 10));
    }
    
    setScore(baseScore);
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      calculateScore(values as CvssFormValues);
    });
    // Calculate initial score
    calculateScore(form.getValues());
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CVSS v3.1 Calculator</CardTitle>
        <CardDescription>Calculate vulnerability scores based on CVSS metrics.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Base Metrics */}
              <div className="space-y-6">
                <h4 className="font-semibold">Base Metrics</h4>
                <CvssMetricGroup form={form} name="AV" label="Attack Vector" options={{ N: 'Network', A: 'Adjacent', L: 'Local', P: 'Physical' }} />
                <CvssMetricGroup form={form} name="AC" label="Attack Complexity" options={{ L: 'Low', H: 'High' }} />
                <CvssMetricGroup form={form} name="PR" label="Privileges Required" options={{ N: 'None', L: 'Low', H: 'High' }} />
                <CvssMetricGroup form={form} name="UI" label="User Interaction" options={{ N: 'None', R: 'Required' }} />
                <CvssMetricGroup form={form} name="S" label="Scope" options={{ U: 'Unchanged', C: 'Changed' }} />
              </div>

              {/* Impact Metrics */}
              <div className="space-y-6">
                 <h4 className="font-semibold">Impact Metrics</h4>
                <CvssMetricGroup form={form} name="C" label="Confidentiality" options={{ H: 'High', L: 'Low', N: 'None' }} />
                <CvssMetricGroup form={form} name="I" label="Integrity" options={{ H: 'High', L: 'Low', N: 'None' }} />
                <CvssMetricGroup form={form} name="A" label="Availability" options={{ H: 'High', L: 'Low', N: 'None' }} />
              </div>
              
              {/* Score Display */}
              <div className="flex flex-col items-center justify-center space-y-4 bg-primary/20 p-6 rounded-lg">
                <h4 className="font-semibold text-lg">Base Score</h4>
                <div className="text-6xl font-bold text-accent">{score.toFixed(1)}</div>
                <Badge variant={getScoreColor(score)} className="text-xl px-4 py-1">{getSeverity(score)}</Badge>
              </div>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}

function CvssMetricGroup<T extends CvssFormValues>({ form, name, label, options }: { form: any; name: keyof T; label: string; options: Record<string, string> }) {
  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className="flex flex-col space-y-1"
            >
              {Object.entries(options).map(([value, optionLabel]) => (
                <div key={value} className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value={value} id={`${name.toString()}-${value}`} />
                  <Label htmlFor={`${name.toString()}-${value}`} className="font-normal">{optionLabel}</Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
