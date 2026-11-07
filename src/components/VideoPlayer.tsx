import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Clapperboard, Loader2, Pause, Play, Trash2, Upload, Volume2, VolumeX } from 'lucide-react';
import { loadVideo, removeVideo, saveVideo } from '../lib/videoStore';
import { fmtTime } from '../lib/format';
import type { Recording, Step } from '../types';
import { Button, useToast } from './ui';

interface Props {
  recording: Recording;
  step: Step;
  canManage: boolean;
  /** Muda de valor quando o usuário escolhe uma etapa: o player vai até lá. */
  seek: { t: number | null; nonce: number };
  onTime: (t: number) => void;
  onDuration: (d: number | null) => void;
}

export const VideoPlayer = ({ recording, step, canManage, seek, onTime, onDuration }: Props) => {
  const toast = useToast();
  const ref = useRef<HTMLVideoElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    let alive = true;
    let created: string | null = null;
    setBusy(true); setUrl(null); setError(''); setPlaying(false); setTime(0); setDuration(0); onDuration(null);
    loadVideo(recording.id).then((blob) => {
      if (!alive) return;
      if (blob) { created = URL.createObjectURL(blob); setUrl(created); }
      setBusy(false);
    });
    return () => { alive = false; if (created) URL.revokeObjectURL(created); };
  }, [recording.id, onDuration]);

  useEffect(() => {
    const v = ref.current;
    if (v && seek.t !== null && seek.nonce > 0 && v.readyState >= 1 && seek.t <= v.duration) v.currentTime = seek.t;
  }, [seek]);

  const pickFile = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Esse arquivo não é um vídeo. Escolha um arquivo MP4 ou WebM.'); return; }
    setBusy(true); setError('');
    const stored = await saveVideo(recording.id, file);
    setUrl(URL.createObjectURL(file));
    setBusy(false);
    toast(stored ? 'Vídeo carregado neste navegador.' : 'Vídeo carregado só até fechar esta aba.');
  }, [recording.id, toast]);

  const remove = async () => {
    await removeVideo(recording.id);
    setUrl(null); setPlaying(false); setDuration(0); setTime(0); onDuration(null);
    toast('Vídeo removido deste navegador.');
  };

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => setError('Não foi possível reproduzir este vídeo.'));
    else v.pause();
  };

  const hasVideo = !!url && !error;

  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-black">
      <input ref={input} type="file" accept="video/*" className="hidden" onChange={pickFile} aria-label="Escolher vídeo local" />
      <div className={`relative aspect-video w-full ${url ? '' : 'min-h-[270px] sm:min-h-0'}`}>
        {url && (
          <video ref={ref} src={url} playsInline className="h-full w-full bg-black" onClick={toggle}
            onLoadedMetadata={(e) => { const d = e.currentTarget.duration; setDuration(d); onDuration(d); }}
            onTimeUpdate={(e) => { const t = e.currentTarget.currentTime; setTime(t); onTime(t); }}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onError={() => setError('O navegador não conseguiu abrir este vídeo. Tente um arquivo MP4 (H.264).')} />
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-ink/70"><Loader2 className="animate-spin text-cream" aria-label="Carregando vídeo" /></div>}
        {!url && !busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-5 text-center"
            style={{ backgroundImage: 'radial-gradient(rgba(254,229,165,.07) 1px, transparent 1px)', backgroundSize: '18px 18px' }}>
            <Clapperboard size={34} className="text-cream/80" aria-hidden />
            <div>
              <p className="font-display text-lg font-semibold text-cream sm:text-xl">Nenhum vídeo carregado em {recording.label}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                Este protótipo não traz vídeo de exemplo. As etapas e orientações desta página continuam disponíveis para consulta.
              </p>
            </div>
            {canManage
              ? <Button icon={Upload} small onClick={() => input.current?.click()}>Carregar vídeo local</Button>
              : <p className="text-sm text-muted">O mestre ou a gestão pode carregar o vídeo original.</p>}
          </div>
        )}
        {error && <p role="alert" className="absolute inset-x-3 bottom-3 rounded-lg bg-ink/90 p-2.5 text-center text-sm text-danger">{error}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line bg-surface px-2 py-2 sm:px-3">
        <button type="button" onClick={toggle} disabled={!hasVideo} aria-label={playing ? 'Pausar' : 'Reproduzir'}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-cream hover:bg-cream/5 disabled:opacity-35">
          {playing ? <Pause size={22} aria-hidden /> : <Play size={22} aria-hidden />}
        </button>
        <span className="text-sm tabular-nums text-muted">{hasVideo ? `${fmtTime(time)} / ${fmtTime(duration)}` : '--:-- / --:--'}</span>
        <input type="range" className="range order-last h-6 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1" min={0} max={duration || 0} step={0.1} value={time} disabled={!hasVideo} aria-label="Barra de progresso do vídeo"
          onChange={(e) => { if (ref.current) ref.current.currentTime = Number(e.target.value); }} />
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <button type="button" disabled={!hasVideo} aria-label={muted ? 'Ativar som' : 'Silenciar'} className="flex h-11 w-11 items-center justify-center rounded-lg text-cream hover:bg-cream/5 disabled:opacity-35"
            onClick={() => { if (ref.current) { ref.current.muted = !muted; setMuted(!muted); } }}>
            {muted || volume === 0 ? <VolumeX size={20} aria-hidden /> : <Volume2 size={20} aria-hidden />}
          </button>
          <input type="range" className="range hidden w-20 sm:block" min={0} max={1} step={0.05} value={volume} disabled={!hasVideo} aria-label="Volume"
            onChange={(e) => { const n = Number(e.target.value); setVolume(n); if (ref.current) ref.current.volume = n; }} />
          {url && canManage && (
            <button type="button" onClick={remove} aria-label="Remover vídeo deste navegador" className="flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:bg-cream/5 hover:text-cream"><Trash2 size={18} aria-hidden /></button>
          )}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">Etapa selecionada: {step.title}</p>
    </div>
  );
};
