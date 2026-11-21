import React from "react";

const Testimonials = () => {
  const learningFeatures = [
    {
      id: 1,
      title: "Learn at your pace",
      message: "Build a learning routine that fits your schedule and goals.",
      image:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=85",
    },
    {
      id: 2,
      title: "Practical skills",
      message: "Learn through focused lessons designed for real-world results.",
      image:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=85",
    },
    {
      id: 3,
      title: "Grow with confidence",
      message:
        "Track your progress and keep moving toward your next milestone.",
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=85",
    },
  ];
  return (
    <section className="bg-white px-[clamp(20px,6vw,88px)] py-[86px]">
      <div className="mx-auto mb-9 max-w-[650px] text-center">
        <span className="text-xs font-extrabold tracking-[2px] text-[#6d4aff]">
          WHY CHOOSE US
        </span>
        <h2 className="my-3 text-[clamp(30px,4vw,44px)] font-bold tracking-[-1px] text-[#17152b]">
          Everything you need to move forward
        </h2>
        <p className="m-0 text-base text-[#687087]">
          Simple tools, useful courses, and a learning experience built around
          you.
        </p>
      </div>
      <div className="mx-auto grid max-w-[420px] grid-cols-1 gap-6 md:max-w-[1180px] md:grid-cols-3">
        {learningFeatures.map((feature) => (
          <article
            className="overflow-hidden rounded-[18px] border border-[#ececf4] bg-white shadow-[0_12px_30px_rgba(33,25,74,0.08)] transition duration-300 hover:-translate-y-[7px] hover:shadow-[0_18px_40px_rgba(33,25,74,0.16)]"
            key={feature.id}
          >
            <img
              className="block h-[210px] w-full object-cover"
              src={feature.image}
              alt={feature.title}
            />
            <div className="p-[22px]">
              <h3 className="mb-2 text-[21px] font-bold text-[#20243a]">
                {feature.title}
              </h3>
              <p className="m-0 leading-relaxed text-[#687087]">
                {feature.message}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
