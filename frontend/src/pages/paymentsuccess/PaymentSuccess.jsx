import React from "react";
import { Link, useParams } from "react-router-dom";

const PaymentSuccess = ({ user }) => {
  const params = useParams();
  return (
    <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_50%_20%,#e7e1ff,transparent_35%),#f7f8fc]">
      {user && (
        <div className="w-[300px] rounded-[20px] border border-[#ececf4] bg-white p-[42px] text-center shadow-[0_18px_45px_rgba(33,25,74,0.1)]">
          <h2 className="mb-[15px] text-2xl font-bold text-[#6d4aff]">
            Payment successful
          </h2>
          <p className="mb-5 text-base text-[#687087]">
            Your course subscription has been activated
          </p>
          <p className="mb-5 text-base text-[#687087]">
            Reference no - {params.id}
          </p>
          <Link
            to={`/${user._id}/dashboard`}
            className="mt-2.5 inline-block rounded-[10px] bg-gradient-to-br from-[#6d4aff] to-[#9b5cff] px-[22px] py-3 font-bold text-white no-underline shadow-lg"
          >
            Go to Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;
