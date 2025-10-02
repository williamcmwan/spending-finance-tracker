import React, { useEffect, useState } from 'react';
import { apiClient } from '@/integrations/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Settings() {
  const { toast } = useToast();
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [extras, setExtras] = useState<string>('');
  const [rates, setRates] = useState<{ 
    currency: string; 
    rate: number | null;
    change?: number;
    changePercent?: number;
    lastUpdate?: string;
    source?: string;
  }[]>([]);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const settings = await apiClient.getSettings();
      setBaseCurrency(settings.base_currency || 'USD');
      setExtras((settings.extra_currencies || []).join(','));
      const r = await apiClient.getRates();
      setRates(r.rates || []);
      setLastFetched(r.lastFetched || null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      const extrasList = extras.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      await apiClient.updateSettings({ base_currency: baseCurrency.toUpperCase(), extra_currencies: extrasList });
      toast({ title: 'Saved', description: 'Settings updated' });
      await load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const refreshRates = async () => {
    try {
      setRefreshing(true);
      const r = await apiClient.getRates();
      setRates(r.rates || []);
      setLastFetched(r.lastFetched || null);
      toast({ title: 'Rates updated', description: 'Exchange rates refreshed from financial data sources' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to fetch rates', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    Light
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Dark
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    System
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your preferred theme or use system setting
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Base Currency (3-letter code)</Label>
            <Input value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value.toUpperCase())} placeholder="USD" />
          </div>
          <div>
            <Label>Other Currencies (comma separated)</Label>
            <Input value={extras} onChange={(e) => setExtras(e.target.value)} placeholder="EUR,HKD,JPY" />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button variant="outline" onClick={refreshRates} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh rates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Exchange Rates vs {baseCurrency.toUpperCase()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time exchange rates from multiple reliable financial data sources
            </p>
          </div>
          {lastFetched && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              Updated: {new Date(lastFetched).toLocaleTimeString()}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-sm text-muted-foreground">{extras.trim() ? 'No rates available. Try Refresh.' : 'No extra currencies configured.'}</div>
          ) : (
            <div className="space-y-3">
              {rates.map(r => (
                <div key={r.currency} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{r.currency} → {baseCurrency.toUpperCase()}</div>
                    {r.source && (
                      <Badge variant="secondary" className="text-xs">
                        {r.source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {r.rate ? (
                      <>
                        <div className="text-right">
                          <div className="font-mono text-sm font-medium">{r.rate.toFixed(4)}</div>
                          {r.changePercent !== undefined && r.changePercent !== 0 && (
                            <div className={`flex items-center text-xs ${r.changePercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {r.changePercent > 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                              ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                              )}
                              {r.changePercent > 0 ? '+' : ''}{r.changePercent.toFixed(2)}%
                              {r.change !== undefined && r.change !== 0 && (
                                <span className="ml-1">
                                  ({r.change > 0 ? '+' : ''}{r.change.toFixed(4)})
                                </span>
                              )}
                            </div>
                          )}
                          {r.lastUpdate && (
                            <div className="text-xs text-muted-foreground">
                              {new Date(r.lastUpdate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-right">
                        <span className="text-muted-foreground text-sm">Rate unavailable</span>
                        <div className="text-xs text-muted-foreground">Try refreshing</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


