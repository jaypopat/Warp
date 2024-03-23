import React, {useContext, useEffect, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {db} from '../firebaseAuth.js';
import {addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, Timestamp} from 'firebase/firestore';
import {
    ChatContainer,
    ConversationList,
    MainContainer,
    MessageInput,
    MessageList,
    Sidebar
} from "@chatscope/chat-ui-kit-react";
import {UserContext} from "../App.jsx";
import "./Dm.css"
import FriendList from "./FriendList.jsx";


function DM() {
    const { user } = useContext(UserContext);
    const { id: user2 } = useParams();
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [user2Data, setUser2Data] = useState({});

    const dmsRef = collection(db, "dms");
    const dmDocId = [user.uid, user2].sort().join('-');
    const dmDocRef = doc(dmsRef, dmDocId);
    const messagesRef = collection(dmDocRef, "messages");

    useEffect(() => {
        const getUser2Data = async () => {
            const user2DocRef = doc(db, "users", user2);
            const user2DocSnap = await getDoc(user2DocRef);
            if (user2DocSnap.exists()) {
                setUser2Data(user2DocSnap.data());
            } else {
                console.log("No such document!");
            }
        };

        getUser2Data();

        const q = query(messagesRef, orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            }));
            setMessages(newMessages);
        });

        return () => unsubscribe();
    }, [user.uid, user2]);


    const handleSubmit = async (messageText) => {
        if (!user2) {
            console.error('user2 is undefined');
            return;
        }

        await setDoc(dmDocRef, { user1: user.uid, user2: user2 }, { merge: true });
        await addDoc(messagesRef, {
            text: messageText,
            createdAt: Timestamp.fromDate(new Date()),
            uid: user.uid,
            userPic: user.photoURL,
        });
        setNewMessage("");
    };

    if (!user2) {
        return <div>Loading...</div>;
    }

    return (<div className="chatroom">
        <div className="chatroom-header">
            <h2>{user2Data.displayName}</h2>
            <Link to="/dm" className="chatroom-header-back">
                ⬅️ Back to all friends
            </Link>
        </div>
        <div className="chatroom-body">
            <MainContainer>
                <Sidebar position="left">
                    <ConversationList>
                        <FriendList/>
                    </ConversationList>
                </Sidebar>
                <ChatContainer>
                    <MessageList>

                        <div className="messages">
                            {messages.map((message) => (<div className="message-container" key={message.id}>
                                <img src={message.userPic} alt="pfp" className="user-pic"/>
                                <div className="message-content">
                                    <span className="user-name">{message.displayName}</span>
                                    <p className="message-text">{message.text}</p>
                                    <p className="message-timestamp">
                                        {message.createdAt?.seconds ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString([], {
                                            hour: '2-digit', minute: '2-digit'
                                        }) : 'No timestamp'}
                                    </p>
                                </div>
                            </div>))}
                        </div>

                    </MessageList>
                    <MessageInput
                        value={newMessage}
                        onChange={(val) => setNewMessage(val)}
                        onSend={handleSubmit}
                        placeholder="Type message here"
                    />
                </ChatContainer>
            </MainContainer>
        </div>
    </div>);
}

export default DM;
