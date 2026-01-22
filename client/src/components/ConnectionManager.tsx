import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SSHProfile, DEFAULT_RELAY_URL, Storage } from "@/lib/storage";
import { ConfigManager, DEFAULT_PROFILES, TerminalConfig, DEFAULT_CONFIG } from "@/lib/config";
import { nanoid } from "nanoid";
import {
  Plus,
  Trash2,
  Save,
  Play,
  Sparkles,
  Server,
  Settings2,
  Download,
  Upload,
  RotateCcw,
} from "lucide-react";

interface ConnectionManagerProps {
  onConnect: (profile: SSHProfile) => void;
}

export default function ConnectionManager({ onConnect }: ConnectionManagerProps) {
  const [profiles, setProfiles] = useState<SSHProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SSHProfile>>({
    port: 22,
    relayUrl: DEFAULT_RELAY_URL,
    authMethod: "password",
  });
  const [config, setConfig] = useState<TerminalConfig>(DEFAULT_CONFIG);
  const [configJson, setConfigJson] = useState("");
  const [activeTab, setActiveTab] = useState("connect");

  useEffect(() => {
    Storage.getProfiles().then(setProfiles);
    ConfigManager.load().then((cfg) => {
      setConfig(cfg);
      setConfigJson(ConfigManager.exportConfig());
    });
  }, []);

  const handleSave = async () => {
    if (!formData.host || !formData.username) return;

    const newProfile: SSHProfile = {
      id: selectedId || nanoid(),
      name: formData.name || `${formData.username}@${formData.host}`,
      host: formData.host,
      port: formData.port || 22,
      username: formData.username,
      authMethod: formData.authMethod || "password",
      password: formData.password,
      privateKey: formData.privateKey,
      passphrase: formData.passphrase,
      relayUrl: formData.relayUrl || DEFAULT_RELAY_URL,
      relayToken: formData.relayToken || "",
    };

    let newProfiles;
    if (selectedId) {
      newProfiles = profiles.map((p) => (p.id === selectedId ? newProfile : p));
    } else {
      newProfiles = [...profiles, newProfile];
    }

    setProfiles(newProfiles);
    await Storage.saveProfiles(newProfiles);
    setSelectedId(newProfile.id);
    setFormData(newProfile);
  };

  const handleNew = () => {
    setSelectedId(null);
    setFormData({
      port: 22,
      relayUrl: config.relayUrl || DEFAULT_RELAY_URL,
      relayToken: config.relayToken || "",
      authMethod: "password",
    });
  };

  const handleDelete = async (id: string) => {
    const newProfiles = profiles.filter((p) => p.id !== id);
    setProfiles(newProfiles);
    await Storage.saveProfiles(newProfiles);
    if (selectedId === id) handleNew();
  };

  const loadProfile = (id: string) => {
    const p = profiles.find((pr) => pr.id === id);
    if (p) {
      setSelectedId(id);
      setFormData(p);
    }
  };

  const quickConnect = (defaultProfile: (typeof DEFAULT_PROFILES)[0]) => {
    const profile: SSHProfile = {
      id: nanoid(),
      name: defaultProfile.name,
      host: defaultProfile.host,
      port: defaultProfile.port,
      username: defaultProfile.username,
      authMethod: "password",
      relayUrl: config.relayUrl || DEFAULT_RELAY_URL,
      relayToken: config.relayToken || "",
    };
    setFormData(profile);
    setSelectedId(null);
  };

  const handleSaveConfig = async () => {
    try {
      const parsed = JSON.parse(configJson);
      await ConfigManager.save(parsed);
      setConfig(parsed);
    } catch (e) {
      alert("Invalid JSON configuration");
    }
  };

  const handleResetConfig = async () => {
    await ConfigManager.reset();
    setConfig(DEFAULT_CONFIG);
    setConfigJson(JSON.stringify(DEFAULT_CONFIG, null, 2));
  };

  const handleExportConfig = () => {
    const blob = new Blob([configJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nebula-terminal-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setConfigJson(content);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="h-full max-w-5xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="connect">Connect</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="flex-1 overflow-auto">
          <div className="flex gap-4">
            {/* Profiles Panel */}
            <Card className="w-1/3 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-primary text-base">Profiles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-primary border-primary/20 hover:bg-primary/10"
                  onClick={handleNew}
                >
                  <Plus className="mr-2 h-4 w-4" /> New Connection
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                  onClick={() =>
                    onConnect({
                      id: "demo",
                      name: "Demo",
                      host: "demo",
                      port: 22,
                      username: "user",
                      authMethod: "password",
                      relayUrl: "",
                      relayToken: "",
                      isDemo: true,
                    })
                  }
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Try Demo
                </Button>

                {/* Quick Connect - Default Profiles */}
                <div className="pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Quick Connect</p>
                  {DEFAULT_PROFILES.map((dp) => (
                    <Button
                      key={dp.name}
                      variant="ghost"
                      className="w-full justify-start text-xs h-8 mb-1"
                      onClick={() => quickConnect(dp)}
                    >
                      <Server className="mr-2 h-3 w-3" />
                      <span className="truncate">{dp.name}</span>
                    </Button>
                  ))}
                </div>

                {/* Saved Profiles */}
                {profiles.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">Saved Profiles</p>
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer group ${
                          selectedId === p.id ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                        onClick={() => loadProfile(p.id)}
                      >
                        <div className="truncate text-sm">{p.name}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(p.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Connection Details */}
            <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connection Details</CardTitle>
                <CardDescription>Configure your SSH connection via Relay.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Profile Name</Label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My Server"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Host / IP</Label>
                    <Input
                      value={formData.host || ""}
                      onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                      placeholder="192.168.1.1 or hostname"
                      className="font-mono bg-background/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={formData.port || 22}
                      onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      className="font-mono bg-background/50"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Username</Label>
                    <Input
                      value={formData.username || ""}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="deploy"
                      className="font-mono bg-background/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Auth Method</Label>
                  <Select
                    value={formData.authMethod}
                    onValueChange={(v: "password" | "privateKey") =>
                      setFormData({ ...formData, authMethod: v })
                    }
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="privateKey">Private Key</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.authMethod === "password" ? (
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Private Key (PEM/OpenSSH)</Label>
                    <Textarea
                      value={formData.privateKey || ""}
                      onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                      className="font-mono text-xs h-24 bg-background/50"
                      placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    />
                    <Input
                      type="password"
                      placeholder="Passphrase (Optional)"
                      value={formData.passphrase || ""}
                      onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="space-y-2">
                    <Label>Relay URL</Label>
                    <Input
                      value={formData.relayUrl || ""}
                      onChange={(e) => setFormData({ ...formData, relayUrl: e.target.value })}
                      placeholder="ws://localhost:8080"
                      className="font-mono bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relay Token</Label>
                    <Input
                      type="password"
                      value={formData.relayToken || ""}
                      onChange={(e) => setFormData({ ...formData, relayToken: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save
                  </Button>
                  <Button
                    onClick={() => formData.host && onConnect(formData as SSHProfile)}
                    disabled={!formData.host || !formData.username}
                  >
                    <Play className="mr-2 h-4 w-4" /> Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Edit your Nebula Terminal configuration. Changes are saved to browser storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleExportConfig}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="mr-2 h-4 w-4" /> Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportConfig}
                      className="hidden"
                    />
                  </label>
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetConfig}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
              </div>

              <Textarea
                value={configJson}
                onChange={(e) => setConfigJson(e.target.value)}
                className="font-mono text-xs h-96 bg-background/50"
                placeholder="Configuration JSON..."
              />

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig}>
                  <Save className="mr-2 h-4 w-4" /> Save Configuration
                </Button>
              </div>

              {/* Quick Settings */}
              <div className="pt-4 border-t border-border space-y-4">
                <h4 className="font-medium">Quick Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Relay URL</Label>
                    <Input
                      value={config.relayUrl}
                      onChange={(e) => setConfig({ ...config, relayUrl: e.target.value })}
                      className="font-mono bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Relay Token</Label>
                    <Input
                      type="password"
                      value={config.relayToken}
                      onChange={(e) => setConfig({ ...config, relayToken: e.target.value })}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Claude Start Directory</Label>
                    <Input
                      value={config.claudeStartDir}
                      onChange={(e) => setConfig({ ...config, claudeStartDir: e.target.value })}
                      className="font-mono bg-background/50"
                      placeholder="~/code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={config.fontSize}
                      onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    ConfigManager.save(config);
                    setConfigJson(JSON.stringify(config, null, 2));
                  }}
                >
                  <Save className="mr-2 h-4 w-4" /> Save Quick Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
