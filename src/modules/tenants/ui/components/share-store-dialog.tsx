"use client";

import { Facebook, Mail, MessageCircle, Twitter, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ShareStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeName: string;
  storeUrl: string;
}

export function ShareStoreDialog({
  open,
  onOpenChange,
  storeName,
  storeUrl,
}: ShareStoreDialogProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out ${storeName} on Toolbay!`;
  const encodedUrl = encodeURIComponent(storeUrl);
  const encodedText = encodeURIComponent(shareText);

  const handleWhatsApp = () => {
    window.open(
      `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      "_blank"
    );
    onOpenChange(false);
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank"
    );
    onOpenChange(false);
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      "_blank"
    );
    onOpenChange(false);
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${encodeURIComponent(
      `${storeName} - Store on Toolbay`
    )}&body=${encodedText}%0A%0A${encodedUrl}`;
    onOpenChange(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Store</DialogTitle>
          <DialogDescription>
            Share {storeName} with your friends and customers
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-3 py-4">
          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-6 w-6 text-green-600" />
            <span className="text-sm">WhatsApp</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={handleFacebook}
          >
            <Facebook className="h-6 w-6 text-blue-600" />
            <span className="text-sm">Facebook</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={handleTwitter}
          >
            <Twitter className="h-6 w-6 text-sky-500" />
            <span className="text-sm">Twitter</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col h-auto py-4 gap-2"
            onClick={handleEmail}
          >
            <Mail className="h-6 w-6 text-gray-600" />
            <span className="text-sm">Email</span>
          </Button>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="secondary"
            className="flex-1 justify-start gap-2"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="text-sm">Copy Link</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
