import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Bell, Vibrate } from "lucide-react";
import { useSoundSettings, SoundType } from "@/hooks/useSoundSettings";
import { playClickSound } from "@/hooks/useClickSound";

const soundTypes: { value: SoundType; label: string; description: string }[] = [
  { value: "touch", label: "Touch", description: "Estilo banco/app moderno" },
  { value: "beep", label: "Beep", description: "Som clássico de sistema" },
  { value: "pop", label: "Pop", description: "Som suave e rápido" },
  { value: "click", label: "Click", description: "Clique mecânico" },
  { value: "chime", label: "Chime", description: "Som musical suave" },
  { value: "tap", label: "Tap", description: "Toque curto e discreto" },
  { value: "ding", label: "Ding", description: "Sino suave" },
];

export function SoundSettingsCard() {
  const { settings: soundSettings, setEnabled, setVolume, setSoundType, setNotificationSoundEnabled, setVibrationEnabled } = useSoundSettings();
  
  const handleTestSound = () => {
    playClickSound();
  };

  return (
    <Card className="p-6 border-2 hover:border-hover/50 hover:shadow-lg hover:shadow-hover/10 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            {soundSettings.enabled ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">Sons do Sistema</h3>
            <p className="text-xs text-muted-foreground">Configure os sons de interação</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="sound-enabled" className="text-sm">
            {soundSettings.enabled ? "Ativado" : "Desativado"}
          </Label>
          <Switch
            id="sound-enabled"
            checked={soundSettings.enabled}
            onCheckedChange={setEnabled}
          />
        </div>
      </div>

      <div className={`space-y-6 transition-opacity duration-300 ${!soundSettings.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Notification Sound Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Som de Notificação</Label>
              <p className="text-xs text-muted-foreground">Tocar som ao receber notificações</p>
            </div>
          </div>
          <Switch
            checked={soundSettings.notificationSoundEnabled}
            onCheckedChange={setNotificationSoundEnabled}
          />
        </div>

        {/* Vibration Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-3">
            <Vibrate className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Vibração</Label>
              <p className="text-xs text-muted-foreground">Feedback háptico ao tocar (móvel)</p>
            </div>
          </div>
          <Switch
            checked={soundSettings.vibrationEnabled}
            onCheckedChange={setVibrationEnabled}
          />
        </div>

        {/* Volume Slider */}
        <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Volume</Label>
            <span className="text-sm text-muted-foreground">{soundSettings.volume}%</span>
          </div>
          <Slider
            value={[soundSettings.volume]}
            onValueChange={(values) => setVolume(values[0])}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Silencioso</span>
            <span>Alto</span>
          </div>
        </div>

        {/* Sound Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Tipo de Som</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {soundTypes.map((sound) => (
              <button
                key={sound.value}
                onClick={() => {
                  setSoundType(sound.value);
                  // Play test sound with new type
                  setTimeout(() => playClickSound(), 50);
                }}
                className={`group p-3 rounded-xl border-2 transition-all duration-300 text-left cursor-pointer hover:scale-[1.02] ${
                  soundSettings.soundType === sound.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-lg shadow-primary/10'
                    : 'border-border hover:border-hover/50 hover:bg-hover/5'
                }`}
              >
                <p className="text-sm font-medium">{sound.label}</p>
                <p className="text-xs text-muted-foreground">{sound.description}</p>
                {soundSettings.soundType === sound.value && (
                  <p className="text-xs text-primary mt-1">✓ Selecionado</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Test Sound Button */}
        <Button 
          variant="outline" 
          onClick={handleTestSound}
          className="w-full gap-2"
        >
          <Volume2 className="h-4 w-4" />
          Testar Som
        </Button>
      </div>
    </Card>
  );
}
