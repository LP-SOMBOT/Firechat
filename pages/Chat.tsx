import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, push, serverTimestamp, set, update, off } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { getChatId, sendMessage } from '../services/db';
import { uploadFile } from '../services/storage';
import { ArrowLeft, Send, Image as ImageIcon, Mic, MoreVertical, Paperclip } from 'lucide-react';
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

  if (!chatId || !friend) return <div className="p-4">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 relative">
      {/* Header */}
      <div className="flex items-center p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <button onClick={() => navigate('/home')} className="mr-3 md:hidden">
          <ArrowLeft className="text-gray-600 dark:text-gray-300" />
        </button>
        <div className="relative">
            <img src={friend.photoURL} className="w-10 h-10 rounded-full" alt="avatar" />
            {friend.isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white"></div>}
        </div>
        <div className="ml-3 flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{friend.username}</h2>
          <p className="text-xs text-gray-500">{friend.isOnline ? 'Online' : 'Offline'}</p>
        </div>
        <MoreVertical className="text-gray-400" size={20} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === userProfile?.uid;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl p-3 shadow-sm ${
                isMe 
                  ? 'bg-brand-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
              }`}>
                {msg.type === 'image' && (
                    <img src={msg.imageURL} alt="Shared" className="rounded-lg max-h-64 object-cover mb-1" />
                )}
                {msg.type === 'audio' && (
                    <audio controls src={msg.audioURL} className="max-w-[200px]" />
                )}
                {msg.text && <p className="text-sm md:text-base leading-relaxed break-words">{msg.text}</p>}
                
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
      <div className="absolute bottom-16 md:bottom-0 w-full p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileUpload}
        />
        <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            disabled={uploading}
        >
            <Paperclip size={20} />
        </button>
        
        <div className="flex-1 relative">
            <input
            type="text"
            className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-full py-2 px-4 focus:ring-2 focus:ring-brand-500 dark:text-white"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
        </div>

        {input.trim() ? (
             <button 
                onClick={handleSend}
                className="p-2 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors"
            >
                <Send size={20} />
            </button>
        ) : (
            <button 
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
            >
                <Mic size={20} />
            </button>
        )}
      </div>
    </div>
  );
}