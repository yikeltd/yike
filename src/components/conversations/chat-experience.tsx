"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Search,
  MapPin,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  Smile,
  AlertTriangle,
  CheckCheck,
  Calendar,
  DollarSign,
  FileText,
  PhoneCall,
  UserCheck,
  Volume2,
  VolumeX,
  MicOff,
  SwitchCamera,
  X,
  Play,
  Pause,
  Maximize2,
  Flag,
  Trash2,
  Ban,
  BellOff,
  Archive,
  User,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { ConversationWorkspace } from "@/lib/conversations/types";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialWorkspace?: ConversationWorkspace | null;
};

type ChatMessage = {
  id: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "doc" | "voice";
  voiceDuration?: number;
  type: "text" | "offer" | "inspection" | "system" | "phone_request";
  status: "sending" | "sent" | "delivered" | "read";
  timestamp: string;
  offerAmount?: number;
  offerStatus?: "pending" | "accepted" | "declined" | "countered";
  inspectionDate?: string;
  inspectionTime?: string;
  phoneRequestedBy?: string;
  phoneStatus?: "pending" | "approved" | "declined";
};

const VEHICLE_QUICK_REPLIES = [
  "Is it still available?",
  "Can I inspect today?",
  "What's your best price?",
  "Has it been accidented?",
  "Can I see more photos?",
  "Is the mileage genuine?",
];

const PROPERTY_QUICK_REPLIES = [
  "Is it still available?",
  "When can I inspect?",
  "Is the rent negotiable?",
  "Is there service charge?",
  "Can I see more photos?",
  "Is there a registered title?",
];

export function ChatExperience({
  conversationId,
  currentUserId,
  initialWorkspace,
}: Props) {
  const router = useRouter();

  // Scroll & Collapsible Listing Summary State
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);

  // Search State
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // In-App Calls State
  const [voiceCallActive, setVoiceCallActive] = useState(false);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callMuted, setCallMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOff, setCameraOff] = useState(false);
  const [frontCamera, setFrontCamera] = useState(true);

  // Phone Approval & Exposure State
  const [phoneApproved, setPhoneApproved] = useState(false);

  // Composer & Warning State
  const [messageText, setMessageText] = useState("");
  const [contactWarningVisible, setContactWarningVisible] = useState(false);

  // Modals State
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerInputAmount, setOfferInputAmount] = useState("");
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionDate, setInspectionDate] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [galleryImage, setGalleryImage] = useState<string | null>(null);

  // Voice Note Recording State
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);

  // Sample Dynamic Listing & Conversation Data
  const isVehicle = initialWorkspace?.listing.title.toLowerCase().includes("camry") || initialWorkspace?.listing.title.toLowerCase().includes("honda") || true;

  const listingTitle = initialWorkspace?.listing.title || "Toyota Camry 2021 XSE — Low Mileage Sedan";
  const listingPrice = initialWorkspace?.listing.price || 18500000;
  const listingLocation = "Lekki, Lagos";
  const listingPhoto = initialWorkspace?.listing.imageUrl || "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80&fit=crop";

  const sellerName = initialWorkspace?.seller.fullName || "Musa Ibrahim (Autos)";
  const sellerPhone = "+234 803 123 4567";

  // Initial Conversation Stream Messages
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      senderId: "seller-123",
      text: "Hello! Welcome to Yike. Are you interested in inspecting this listing?",
      type: "text",
      status: "read",
      timestamp: "10:14 AM",
    },
    {
      id: "m-2",
      senderId: currentUserId,
      text: "Hi Musa, yes I am! Is the price slightly negotiable?",
      type: "text",
      status: "read",
      timestamp: "10:16 AM",
    },
  ]);

  // Handle Collapsible Listing Summary on Scroll
  function handleScroll() {
    if (!scrollContainerRef.current) return;
    const currentScrollTop = scrollContainerRef.current.scrollTop;

    if (currentScrollTop > 80 && currentScrollTop > lastScrollTopRef.current) {
      setSummaryCollapsed(true);
    } else if (currentScrollTop < lastScrollTopRef.current - 20 || currentScrollTop <= 30) {
      setSummaryCollapsed(false);
    }

    lastScrollTopRef.current = currentScrollTop;
  }

  // Call Duration Timer Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voiceCallActive || videoCallActive) {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [voiceCallActive, videoCallActive]);

  // Evaluate Outgoing Composer Text for Smart Warning
  function handleMessageTextChange(val: string) {
    setMessageText(val);
    const keywords = ["whatsapp", "wa", "telegram", "call me", "text me", "080", "090", "070", "081"];
    const match = keywords.some((kw) => val.toLowerCase().includes(kw));
    setContactWarningVisible(match);
  }

  function formatCallTimer(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function handleSendMessage(textToSend?: string) {
    const body = textToSend || messageText;
    if (!body.trim()) return;

    // eslint-disable-next-line react-hooks/purity
    const id = `msg-${Math.random().toString(36).substring(2, 9)}`;
    const newMessage: ChatMessage = {
      id,
      senderId: currentUserId,
      text: body.trim(),
      type: "text",
      status: "sent",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);
    if (!textToSend) setMessageText("");
    setContactWarningVisible(false);

    // Auto-scroll timeline to bottom
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  }

  function handleSendOffer() {
    if (!offerInputAmount) return;
    const amount = Number(offerInputAmount);

    const offerMessage: ChatMessage = {
      id: `offer-${Date.now()}`,
      senderId: currentUserId,
      type: "offer",
      offerAmount: amount,
      offerStatus: "pending",
      status: "sent",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, offerMessage]);
    setOfferModalOpen(false);
    setOfferInputAmount("");
  }

  function handleRequestPhoneNumber() {
    const reqMsg: ChatMessage = {
      id: `phone-${Date.now()}`,
      senderId: currentUserId,
      type: "phone_request",
      phoneRequestedBy: currentUserId,
      phoneStatus: "pending",
      status: "sent",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, reqMsg]);
  }

  function handleApprovePhoneRequest(msgId: string) {
    setPhoneApproved(true);
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, phoneStatus: "approved" } : m))
    );
  }

  const quickReplies = isVehicle ? VEHICLE_QUICK_REPLIES : PROPERTY_QUICK_REPLIES;
  const filteredMessages = searchQuery
    ? messages.filter((m) => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="flex h-[100dvh] w-full flex-col bg-[#f8fafc] text-navy select-none">
      {/* 1. FIXED TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Seller Avatar & Online Status */}
          <div className="relative shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white font-bold text-sm shadow-xs">
              {sellerName.charAt(0)}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xs font-black text-navy leading-tight truncate max-w-[140px] sm:max-w-[200px]">
              {sellerName}
            </h1>
            <p className="text-[10px] font-semibold text-emerald-600 leading-none">
              🟢 Online
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {searchOpen ? (
            <div className="flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chat…"
                className="w-24 bg-transparent text-navy focus:outline-none"
              />
              <button type="button" onClick={() => setSearchOpen(false)}>
                <X className="h-3.5 w-3.5 text-navy/60" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200"
            >
              <Search className="h-4 w-4" />
            </button>
          )}

          {/* Voice Call Button (Switches to Call Seller if Phone Approved) */}
          {phoneApproved ? (
            <a
              href={`tel:${sellerPhone}`}
              className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:bg-emerald-700"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Call Seller</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setVoiceCallActive(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            >
              <Phone className="h-4 w-4" />
            </button>
          )}

          {/* Video Call Button */}
          <button
            type="button"
            onClick={() => setVideoCallActive(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
          >
            <Video className="h-4 w-4" />
          </button>

          {/* More Menu Toggle */}
          <button
            type="button"
            onClick={() => setMoreMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. COLLAPSIBLE LISTING SUMMARY CARD */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out border-b border-slate-200 bg-white px-3.5 shadow-xs overflow-hidden",
          summaryCollapsed ? "max-h-0 py-0 opacity-0" : "max-h-24 py-2.5 opacity-100"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
              <Image src={listingPhoto} alt={listingTitle} fill className="object-cover" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-xs font-black text-navy truncate">{listingTitle}</h2>
              <p className="text-xs font-extrabold text-gold-dark">
                ₦{listingPrice.toLocaleString()}
              </p>
              <p className="text-[10px] font-semibold text-navy/60 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-navy/40" />
                <span>{listingLocation}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/agent/listings")}
            className="flex items-center gap-1 rounded-xl bg-navy px-3 py-1.5 text-xs font-black text-white shrink-0 shadow-xs hover:bg-navy-light"
          >
            <span>View Listing</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 3. CONVERSATION TIMELINE STREAM */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3.5 space-y-3"
      >
        {filteredMessages.map((msg) => {
          const isMine = msg.senderId === currentUserId;

          if (msg.type === "offer") {
            return (
              <div key={msg.id} className="mx-auto w-full max-w-xs rounded-2xl border border-amber-300 bg-amber-50 p-3.5 shadow-sm text-navy space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    Offer Received
                  </span>
                  <span className="text-[10px] font-bold text-navy/50">{msg.timestamp}</span>
                </div>

                <div className="text-center py-1">
                  <p className="text-xl font-black text-navy">₦{msg.offerAmount?.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-navy/60">Official Offer Submitted</p>
                </div>

                {!isMine && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Offer Accepted! Let's arrange finalizing the transaction.")}
                      className="rounded-xl bg-emerald-600 py-1.5 text-xs font-black text-white shadow-xs"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Offer declined. Thank you.")}
                      className="rounded-xl bg-rose-100 py-1.5 text-xs font-black text-rose-800"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          }

          if (msg.type === "phone_request") {
            return (
              <div key={msg.id} className="mx-auto w-full max-w-xs rounded-2xl border border-slate-300 bg-white p-3.5 shadow-sm text-navy space-y-2 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-black text-navy">
                  <Phone className="h-4 w-4 text-gold-dark" />
                  <span>Phone Number Requested</span>
                </div>
                <p className="text-[11px] font-medium text-navy/70">
                  {isMine ? "You requested the seller's phone number." : "Buyer requested your direct phone number."}
                </p>

                {!isMine && msg.phoneStatus === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleApprovePhoneRequest(msg.id)}
                      className="flex-1 rounded-xl bg-gold py-1.5 text-xs font-black text-navy shadow-xs"
                    >
                      Approve Phone
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-xl bg-slate-100 py-1.5 text-xs font-bold text-navy"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {msg.phoneStatus === "approved" && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 py-1 text-xs font-bold text-emerald-800">
                    ✓ Phone Approved: {sellerPhone}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={cn("flex flex-col max-w-[80%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}
            >
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed font-semibold",
                  isMine
                    ? "bg-navy text-white rounded-br-none"
                    : "bg-white text-navy border border-slate-200 rounded-bl-none"
                )}
              >
                {msg.text}
              </div>

              <div className="flex items-center gap-1 pt-1 text-[9px] font-bold text-navy/50">
                <span>{msg.timestamp}</span>
                {isMine && <CheckCheck className="h-3 w-3 text-emerald-600" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. SMART CONTACT WARNING (SUBTLE, NON-BLOCKING) */}
      {contactWarningVisible && (
        <div className="mx-3.5 my-1 rounded-2xl border border-amber-300 bg-amber-50 p-2.5 text-[11px] font-bold text-amber-900 flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>⚠️ Trade carefully. For your safety, keep conversations and payments on Yike whenever possible.</span>
        </div>
      )}

      {/* 5. SUGGESTED ACTION CHIPS & QUICK REPLIES */}
      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 space-y-2">
        {/* Suggested Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setOfferModalOpen(true)}
            className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-xs font-black text-navy shrink-0 hover:bg-gold/30"
          >
            <DollarSign className="h-3.5 w-3.5 text-gold-dark" />
            <span>Make Offer</span>
          </button>

          <button
            type="button"
            onClick={() => setInspectionModalOpen(true)}
            className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-navy shrink-0 hover:bg-slate-100"
          >
            <Calendar className="h-3.5 w-3.5 text-navy/60" />
            <span>Schedule Inspection</span>
          </button>

          <button
            type="button"
            onClick={handleRequestPhoneNumber}
            className="flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-navy shrink-0 hover:bg-slate-100"
          >
            <Phone className="h-3.5 w-3.5 text-navy/60" />
            <span>Request Phone</span>
          </button>
        </div>

        {/* Quick Replies */}
        {messages.length < 5 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSendMessage(reply)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold text-navy/80 shrink-0 hover:border-gold"
              >
                &quot;{reply}&quot;
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. MESSAGE COMPOSER */}
      <footer className="border-t border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-navy hover:bg-slate-200 shrink-0"
          >
            <ImageIcon className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={messageText}
            onChange={(e) => handleMessageTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-xs font-medium text-navy placeholder:text-navy/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />

          <button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!messageText.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-navy shrink-0 shadow-md hover:bg-gold-light disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {/* IN-APP VOICE CALL OVERLAY */}
      {voiceCallActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-navy p-8 text-white text-center animate-in fade-in">
          <div className="pt-12 space-y-3">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gold/20 border-2 border-gold text-gold font-black text-3xl shadow-2xl">
              {sellerName.charAt(0)}
            </div>
            <h3 className="text-xl font-black">{sellerName}</h3>
            <p className="text-xs font-bold text-gold">Yike In-App Voice Call</p>
            <p className="text-sm font-black tracking-widest">{formatCallTimer(callDuration)}</p>
          </div>

          <div className="flex items-center gap-6 pb-12">
            <button
              type="button"
              onClick={() => setCallMuted(!callMuted)}
              className={cn("flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white", callMuted ? "bg-rose-600" : "bg-white/10")}
            >
              {callMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            <button
              type="button"
              onClick={() => setVoiceCallActive(false)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl hover:bg-rose-700"
            >
              <Phone className="h-7 w-7 rotate-[135deg]" />
            </button>

            <button
              type="button"
              onClick={() => setSpeakerOn(!speakerOn)}
              className={cn("flex h-14 w-14 items-center justify-center rounded-full border border-white/20 text-white", speakerOn ? "bg-gold text-navy" : "bg-white/10")}
            >
              {speakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>
          </div>
        </div>
      )}

      {/* IN-APP VIDEO CALL OVERLAY */}
      {videoCallActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black p-6 text-white text-center animate-in fade-in">
          <div className="pt-8 flex items-center justify-between w-full">
            <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-black text-gold">
              Video Call • {formatCallTimer(callDuration)}
            </span>
            <button
              type="button"
              onClick={() => setFrontCamera(!frontCamera)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black">{sellerName}</h3>
            <p className="text-xs font-semibold text-white/70">Connecting HD Video Stream…</p>
          </div>

          <div className="flex items-center gap-6 pb-8">
            <button
              type="button"
              onClick={() => setVideoCallActive(false)}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl"
            >
              <Video className="h-7 w-7" />
            </button>
          </div>
        </div>
      )}

      {/* MAKE OFFER MODAL */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Make an Offer</h3>
              <button type="button" onClick={() => setOfferModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy/70">Offer Amount (₦)</label>
              <input
                type="number"
                value={offerInputAmount}
                onChange={(e) => setOfferInputAmount(e.target.value)}
                placeholder="e.g. 17,500,000"
                className="w-full rounded-2xl border border-slate-300 p-3 text-sm font-black text-navy focus:border-gold focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSendOffer}
              className="w-full rounded-2xl bg-gold py-3 text-xs font-black text-navy shadow-md hover:bg-gold-light"
            >
              Send Offer Card
            </button>
          </div>
        </div>
      )}

      {/* MORE MENU SHEET */}
      {moreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl space-y-3 text-navy">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black uppercase text-navy">Chat Actions</h3>
              <button type="button" onClick={() => setMoreMenuOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMoreMenuOpen(false);
                  setReportModalOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-rose-700 hover:bg-rose-50"
              >
                <Flag className="h-4 w-4" />
                <span>Report User</span>
              </button>

              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-navy hover:bg-slate-50"
              >
                <Ban className="h-4 w-4" />
                <span>Block User</span>
              </button>

              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-navy hover:bg-slate-50"
              >
                <BellOff className="h-4 w-4" />
                <span>Mute Notifications</span>
              </button>

              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-navy hover:bg-slate-50"
              >
                <Archive className="h-4 w-4" />
                <span>Archive Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
