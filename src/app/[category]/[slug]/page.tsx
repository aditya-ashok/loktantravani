// Re-export the blog post page — same component handles /category/slug and /blog/slug
export { default, generateMetadata, generateStaticParams } from "@/app/blog/[slug]/page";
