"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PostForm } from "@/components/posts/post-form";
import {
  type PostCategory,
  getPostCategories,
} from "@/lib/api/post-categories";
import { type AdminPost, getPostById } from "@/lib/api/posts";
import { withAuthRefresh } from "@/lib/api/session";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [post, setPost] = useState<AdminPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      async function loadForm() {
        setIsLoading(true);
        setError(null);

        try {
          const [postResponse, categoryResponse] = await Promise.all([
            withAuthRefresh(() => getPostById(params.id), redirectToLogin),
            withAuthRefresh(getPostCategories, redirectToLogin),
          ]);

          if (!postResponse || !categoryResponse) {
            return;
          }

          setPost(postResponse.data);
          setCategories(categoryResponse.data);
        } catch (caughtError) {
          setError(getErrorMessage(caughtError, "Unable to load post."));
        } finally {
          setIsLoading(false);
        }
      }

      void loadForm();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [params.id, redirectToLogin]);

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-zinc-200 pb-6">
        <Link
          href="/dashboard/posts"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          Posts
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">
          Edit Post
        </h1>
      </header>

      {error ? (
        <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="mt-8 text-sm text-zinc-600">Loading form...</p>
      ) : null}

      {!isLoading && post && categories.length > 0 ? (
        <div className="mt-8">
          <PostForm categories={categories} initialPost={post} />
        </div>
      ) : null}
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
