import React, { useState } from 'react';
import { Share2, Twitter, Facebook, Linkedin, Link2, WhatsApp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface ShareButtonProps {
  url?: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  politician?: {
    name: string;
    score: number;
    party: string;
    state: string;
  };
}

export function ShareButton({ 
  url = window.location.href, 
  title = 'A Bancada Evangélica', 
  description = 'Transparência parlamentar baseada em valores cristãos',
  hashtags = ['BancadaEvangelica', 'TransparenciaPolitica', 'ValoresCristaos'],
  politician
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Personalizar mensagem se for compartilhamento de político
  const shareTitle = politician 
    ? `Perfil de ${politician.name} - A Bancada Evangélica`
    : title;

  const shareDescription = politician
    ? `${politician.name} (${politician.party}/${politician.state}) tem pontuação ${politician.score.toFixed(1)} na avaliação de alinhamento com valores cristãos. Confira o perfil completo!`
    : description;

  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(shareTitle);
  const shareDescriptionEncoded = encodeURIComponent(shareDescription);
  const hashtagsString = hashtags.join(',');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}&hashtags=${hashtagsString}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${shareDescriptionEncoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${shareText}&summary=${shareDescriptionEncoded}`,
    whatsapp: `https://wa.me/?text=${shareText}%20-%20${shareDescriptionEncoded}%20${shareUrl}`,
    telegram: `https://t.me/share/url?url=${shareUrl}&text=${shareText}%20-%20${shareDescriptionEncoded}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência!');
      setIsOpen(false);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: url
        });
        setIsOpen(false);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  const openShareWindow = (platform: string) => {
    const shareUrl = shareLinks[platform as keyof typeof shareLinks];
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Compartilhar</h4>
            <p className="text-sm text-gray-600 mb-4">
              {politician ? `Compartilhe o perfil de ${politician.name}` : 'Compartilhe esta página'}
            </p>
          </div>

          {/* Native Share Button (mobile) */}
          {navigator.share && (
            <Button 
              onClick={handleNativeShare}
              className="w-full justify-start"
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          )}

          {/* Social Media Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => openShareWindow('whatsapp')}
              className="justify-start bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <WhatsApp className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>

            <Button 
              onClick={() => openShareWindow('twitter')}
              className="justify-start bg-blue-400 hover:bg-blue-500 text-white"
              size="sm"
            >
              <Twitter className="w-4 h-4 mr-2" />
              Twitter
            </Button>

            <Button 
              onClick={() => openShareWindow('facebook')}
              className="justify-start bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>

            <Button 
              onClick={() => openShareWindow('linkedin')}
              className="justify-start bg-blue-700 hover:bg-blue-800 text-white"
              size="sm"
            >
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </Button>

            <Button 
              onClick={() => openShareWindow('telegram')}
              className="justify-start bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Telegram
            </Button>

            <Button 
              onClick={copyToClipboard}
              className="justify-start"
              variant="outline"
              size="sm"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Copiar Link
            </Button>
          </div>

          {/* Quick Share Text */}
          {politician && (
            <div className="border-t pt-4">
              <p className="text-xs text-gray-600 mb-2">Texto pronto para compartilhar:</p>
              <div className="bg-gray-50 p-3 rounded text-xs">
                "{shareDescription}"
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}