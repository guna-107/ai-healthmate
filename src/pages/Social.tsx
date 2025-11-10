import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  profiles: {
    full_name: string | null;
  };
  comments: { count: number }[];
  post_likes: { user_id: string }[];
}

export default function Social() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPosts();
    subscribeToChanges();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          profiles(full_name),
          comments(count),
          post_likes(user_id)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel("posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        () => {
          loadPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreatePost = async () => {
    if (!user || !newPost.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: newPost,
      });

      if (error) throw error;

      setNewPost("");
      toast.success("Post created!");
      loadPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const existingLike = posts
        .find((p) => p.id === postId)
        ?.post_likes.find((like) => like.user_id === user.id);

      if (existingLike) {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
      }

      loadPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const isLiked = (post: Post) => {
    return post.post_likes.some((like) => like.user_id === user?.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-foreground">Community Feed</h1>

        {user && (
          <Card className="mb-8">
            <CardHeader>
              <p className="font-semibold text-foreground">Share your progress</p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What's your health win today?"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="mb-4"
                rows={3}
              />
              <Button onClick={handleCreatePost} disabled={loading || !newPost.trim()}>
                {loading ? "Posting..." : "Post"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {post.profiles?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">
                      {post.profiles?.full_name || "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{post.content}</p>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="rounded-lg w-full mb-4"
                  />
                )}
                <div className="flex items-center gap-4 pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    className={isLiked(post) ? "text-red-500" : ""}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${isLiked(post) ? "fill-current" : ""}`}
                    />
                    {post.likes_count}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {post.comments[0]?.count || 0}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
