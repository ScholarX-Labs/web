import styles from "./Contact.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useRef } from "react";
import { FaCalendarAlt } from "react-icons/fa";

export default function Contact() {
  const [startDate, setStartDate] = useState(new Date());
  const datePickerRef = useRef(null);

  // Function to filter out weekends
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  // Filter out times outside of 9 AM to 5 PM (Cairo business hours).
  // NOTE: The date picker operates in the user's LOCAL browser timezone.
  // We add a label stating the intended timezone (EET/EEST, Cairo)
  // so international users can calculate the correct slot.
  const isValidTime = (time) => {
    const hours = time.getHours();
    return hours >= 9 && hours < 17; // 09:00 – 17:00 (5 PM cut-off)
  };

  // Function to open the date picker
  const openDatePicker = () => {
    datePickerRef.current.setOpen(true);
  };

  return (
    <>
      <div id="contact" className={` ${styles.container} `}>
        <div>
          <h1 className={`${styles.title} mb-5`}>Get in Touch</h1>
        </div>

        <div className="row">
          <div className="col-md-6 d-flex justify-content-center">
            <div
              className={`${styles.form} ${styles["message-form"]} w-75 p-5 text-start`}
            >
              <h4 className={`${styles.title} `}>Send us a Message</h4>
              <form onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="name" className="form-label ">name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="name"
                  className="form-control mb-3"
                />

                <label htmlFor="email">email</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  placeholder="email"
                  className="form-control mb-3"
                />

                <label htmlFor="message">message</label>
                <textarea
                  className="form-control mb-3"
                  id="message"
                  name="message"
                ></textarea>
                <button type="submit" className={`w-100 ${styles.btn}`}>
                  {" "}
                  submit
                </button>
              </form>
            </div>
          </div>

          <div className="col-md-6 d-flex justify-content-center">
            <div
              className={`${styles.form} ${styles["schedule-form"]} w-75 p-4 text-start`}
            >
              <h4 className={`${styles.title}`}>Schedule a Call</h4>
              <p className={`${styles.description} text-muted`}>
                Book a 30-minute consultation with our team to discuss your
                needs.
              </p>

              <div
                className="p-3 mb-3 border border primary rounded"
                onClick={openDatePicker}
                style={{ cursor: "pointer" }}
              >
                <label
                  htmlFor="appointment"
                  className="d-flex align-items-center mb-2"
                >
                  <FaCalendarAlt className="me-2 fs-3" />
                  Available Slots Mon–Fri, 9 AM – 5 PM{" "}
                  <span className="text-muted ms-1">
                    (Cairo Time — EET/EEST)
                  </span>
                </label>
                <DatePicker
                  ref={datePickerRef}
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  showTimeSelect
                  dateFormat="Pp"
                  className="form-control mb-3"
                  minDate={new Date()}
                  filterDate={isWeekday}
                  filterTime={isValidTime}
                />
              </div>

              <button type="submit" className={`w-100 ${styles.btn}`}>
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
