import React from "react"
import { Link } from "react-router-dom";

import * as Icon1 from "react-icons/io5"
import * as Icon2 from "react-icons/hi2"
import * as Icon3 from "react-icons/ai";
import { FaExternalLinkAlt } from "react-icons/fa";


const contactDetails = [
  {
    icon: "HiChatBubbleLeftRight",
    heading: "Chat on us",
    description: "Our friendly team is here to help.",
    details: "1hardstudy1@gmail.com",
  },
  {
    icon: "IoCall",
    heading: "Call us",
    description: "Mon - Fri From 8am to 5pm",
    details: "+91 7905153144",
  },
  {
    icon: "AiOutlineLinkedin",
    heading: "Connect with US",
    description: "For more information about author.",
    details: "i have something",
  },
]

const ContactDetails = () => {
  return (
    <div className="flex flex-col gap-6 rounded-xl bg-richblack-800 p-4 lg:p-6">
      {contactDetails.map((ele, i) => {
        let Icon =  Icon1[ele.icon] || Icon2[ele.icon] || Icon3[ele.icon]
        return (
          <div
            className="flex flex-col gap-[2px] p-3 text-sm text-richblack-200"
            key={i}
          >
            <div className="flex flex-row items-center gap-3">
              <Icon size={25} />
              <h1 className="text-lg font-semibold text-richblack-5">
                {ele?.heading}
              </h1>
            </div>
            <p className="font-medium">{ele?.description}  </p>
            {
              (i===2) ? ( <Link to="https://www.linkedin.com/in/kishankrishna/" target="_blank" className="font-medium" ><FaExternalLinkAlt /></Link> ) : ( <p className="font-semibold">{ele?.details}</p> )
            }
          </div>
        )
      })}
    </div>
  )
}

export default ContactDetails