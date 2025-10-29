"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Download, X } from "lucide-react";
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}
export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };
  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };
  if (isInstalled || !showInstallPrompt) return null;
  const dismissedTime = localStorage.getItem("pwa-install-dismissed");
  if (
    dismissedTime &&
    Date.now() - Number.parseInt(dismissedTime) < 24 * 60 * 60 * 1000
  ) {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card
        className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 
        dark:bg-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-50"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-lg">Instalar App</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Instala EDIUSA para un acceso más rápido y funciones offline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex space-x-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Instalar
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Más tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
