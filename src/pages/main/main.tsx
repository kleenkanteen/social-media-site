import { useEffect, useState } from "react";
import { auth, db } from "../../config/firebase";
import { Post } from "./post";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export interface Post {
  id: string;
  userId: string;
  title: string;
  username: string;
  description: string;
  downloadURL?: string;
}

export interface Follow {
  followingUserId: string;
}

export const Main = ({ home }: { home: boolean }) => {
  const [postsList, setPostsList] = useState<Post[] | null>(null);
  const [followingList, setFollowingList] = useState<string[] | null>(null);
  const [user] = useAuthState(auth);

  console.log(`goign home is ${home}`);
  
  const postsRef = collection(db, "posts");
  let data: any;
  console.log(`current user is ${user?.displayName} + ${user?.uid} wants`)
  const getPosts = async () => {
    console.log("get posts");
    console.log(`looking for just posts user ${user?.displayName} wants`);

    if (!home) {
      console.log("looking for all posts");
      data = await getDocs(postsRef);

    } else {
      if (!user) {
        console.log("home feed cannot show if not logged in");
        return;
      }
      
      console.log("home feed only");
      const followingRef = collection(db, "following");
      console.log(`current user ID is ${user?.uid}`);
      const followerQuery = query(followingRef, where("FollowerUserId", "==", user?.uid));
      const followingData: any = await getDocs(followerQuery);
  
      console.log(`following userID ${followingData.docs[0].data().FollowingUserId}`);
      const followingPromises = await followingData.docs.map(async (doc: any) => {
        console.log(`following userID ${doc.data().FollowingUserId}`);
        return doc.data().FollowingUserId;
      });
  
      const resolvedFollowingList = await Promise.all(followingPromises);
      setFollowingList(await followingPromises);
  
      console.log(`Following list is ${resolvedFollowingList}`);
      if (!resolvedFollowingList) return;
      const SubscribedPosts = query(postsRef, where("userId", "in", resolvedFollowingList));
      data = await getDocs(SubscribedPosts);
    };
  
    setPostsList(
      data.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as Post[]
    );
  };
  
  useEffect(() => {
    getPosts();
  }, [home]);

  return (
    <div>
      {postsList?.map((post) => (
        <Post post={post} />
      ))}
    </div>
  );
};
