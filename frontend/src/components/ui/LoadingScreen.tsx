import { GraduationCap } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#FAF8FC]">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black text-white border border-purple-900/50 shadow-sm mb-4">
          <GraduationCap className="w-5 h-5 text-purple-400" />
        </div>
        <div className="text-base font-bold text-black tracking-tight">TaskTrack AI</div>
        <div className="text-xs text-purple-900/70 mt-1 mb-5">Preparing your study workspace...</div>
        <div className="w-36 h-1 rounded-full bg-purple-100 overflow-hidden">
          <div className="h-full w-1/2 bg-purple-700 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
