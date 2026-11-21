import React, { useEffect, useState } from "react";
import axios from "axios";
import { server } from "../../main";
import Layout from "../Utils/Layout";
import toast from "react-hot-toast";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  async function fetchUsers() {
    try {
      const { data } = await axios.get(`${server}/api/users`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      setUsers(data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load users");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId) => {
    if (confirm("are you sure you want to update this user role")) {
      try {
        const { data } = await axios.put(
          `${server}/api/user/${userId}`,
          {},
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          },
        );

        toast.success(data.message);
        fetchUsers();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to update this role",
        );
      }
    }
  };

  return (
    <Layout>
      <div className="mx-auto my-5 w-[94%] max-w-[900px] overflow-x-auto rounded-2xl border border-[#ececf4] bg-white p-5 shadow-[0_12px_30px_rgba(33,25,74,0.08)]">
        <h1 className="mb-5 text-3xl font-bold">All Users</h1>
        <table className="w-full min-w-[650px] border-collapse text-left [&_td]:border-b [&_td]:border-[#ececf4] [&_td]:p-3">
          <thead>
            <tr>
              <td>#</td>
              <td>name</td>
              <td>email</td>
              <td>role</td>
              <td>update role</td>
            </tr>
          </thead>

          {users &&
            users.map((user, index) => (
              <tbody key={user._id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button
                      onClick={() => updateRole(user._id)}
                      className="rounded-[10px] bg-gradient-to-br from-[#6d4aff] to-[#9b5cff] px-4 py-2 font-bold text-white"
                    >
                      Update Role
                    </button>
                  </td>
                </tr>
              </tbody>
            ))}
        </table>
      </div>
    </Layout>
  );
};

export default AdminUsers;
