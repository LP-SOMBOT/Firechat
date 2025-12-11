import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, serverTimestamp, set, update, off } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getChatId, sendMessage } from '../services/db';
import { uploadFile } from '../services/storage';
import { ArrowLeft, Send, Image as ImageIcon, Mic, MoreVertical, Paperclip, X } from 'lucide-react';
import { Message } from '../types';

export default function Chat() {
  const { chatId: friendUid } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [friend, setFriend] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const chatId = userProfile && friendUid ? getChatId(userProfile.uid, friendUid) : null;

  // Load friend info
  useEffect(() => {
    if (!friendUid) return;
    const friendRef = ref(db, `users/${friendUid}`);
    onValue(friendRef, (snap) => setFriend(snap.val()));
  }, [friendUid]);

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.values(data) as Message[];
        msgList.sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgList);
      }
    });

    return () => off(messagesRef);
  }, [chatId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatId || !userProfile) return;
    const text = input;
    setInput('');
    await sendMessage(chatId, {
      senderId: userProfile.uid,
      text,
      type: 'text',
      seen: false,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId || !userProfile) return;

    setUploading(true);
    try {
      const url = await uploadFile(file, `chats/${chatId}/${Date.now()}_${file.name}`);
      await sendMessage(chatId, {
        senderId: userProfile.uid,
        imageURL: url,
        type: 'image',
        seen: false,
      });
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        if(!chatId || !userProfile) return;
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], "voice_message.webm", { type: 'audio/webm' });
        
        setUploading(true);
        const url = await uploadFile(file, `chats/${chatId}/audio/${Date.now()}.webm`);
        await sendMessage(chatId, {
          senderId: userProfile.uid,
          audioURL: url,
          type: 'audio',
          seen: false
        });
        setUploading(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error", err);
      alert("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  if (!chatId || !friend) return <div className="p-4 flex h-full items-center justify-center">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="shrink-0 flex items-center p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-10">
        <button onClick={() => navigate('/home')} className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden">
          <ArrowLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="relative">
            <img src={friend.photoURL} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" alt="avatar" />
            {friend.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>}
        </div>
        <div className="ml-3 flex-1 overflow-hidden">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">{friend.username}</h2>
          <p className="text-xs text-gray-500 truncate">{friend.isOnline ? 'Online' : 'Offline'}</p>
        </div>
        <MoreVertical className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-200" size={20} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
        {messages.map((msg) => {
          const isMe = msg.senderId === userProfile?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                isMe 
                  ? 'bg-brand-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
              }`}>
                {msg.type === 'image' && (
                    <img src={msg.imageURL} alt="Shared" className="rounded-lg max-h-64 object-cover mb-1 w-full" />
                )}
                {msg.type === 'audio' && (
                    <audio controls src={msg.audioURL} className="max-w-[200px]" />
                )}
                {msg.text && <p className="text-sm md:text-base leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                
                <div className={`text-[10px] mt-1 flex items-center justify-end opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-end gap-2 pb-safe">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
        />
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="mb-1 p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            disabled={uploading}
        >
            <Paperclip size={22} />
        </button>
        
        <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <textarea
              className="w-full bg-transparent border-none py-3 px-4 max-h-32 min-h-[44px] focus:ring-0 text-gray-900 dark:text-white resize-none"
              placeholder="Type a message..."
              rows={1}
              value={input}
              onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                      // Reset height
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                  }
              }}
            />
        </div>

        {input.trim() || uploading ? (
             <button 
                onClick={handleSend}
                disabled={uploading || !input.trim()}
                className="mb-1 p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                <Send size={20} className={uploading ? "animate-spin" : ""} />
            </button>
        ) : (
            <button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`mb-1 p-2 rounded-full transition-all shadow-sm ${isRecording ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
            >
                <Mic size={22} />
            </button>
        )}
      </div>
    </div>
  );
}