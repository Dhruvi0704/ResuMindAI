import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

// Added interfaces so TypeScript knows structure of form data & errors
interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // Added error state (needed for showing validation messages)
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  // Validation logic
  const validateForm = () => {
    let valid = true;

    const newErrors: FormErrors = {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    };

    // Name validation (letters only, must not be empty)
    if (!formData.name.trim() || !/^[A-Za-z\s]+$/.test(formData.name.trim())) {
      newErrors.name = "Name should contain only letters and spaces.";
      valid = false;
    }

    // Email: valid format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
      valid = false;
    }

    // Phone: only digits, exactly 10 numbers
    if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
      valid = false;
    }

    // Subject: must not be empty and at least 3 characters
    if (formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters long.";
      valid = false;
    }

    // Message: must not be empty and at least 10 characters
    if (formData.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters long.";
      valid = false;
    }

    // Set validation messages
    setErrors(newErrors);
    return valid;
  };

  // Added validation call before submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateForm()) return; // Stops submission if invalid

    console.log("Contact form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");

    // Reset form and clear errors after successful submit
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setErrors({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* LEFT: Contact Form */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Get in Touch</h2>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name Field */}
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                  {/*  Added visible error message */}
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="you@example.com"
                    className="mt-1"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        subject: e.target.value,
                      }))
                    }
                    placeholder="Enter subject"
                    className="mt-1"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subject}
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    rows={5}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    placeholder="Write your message..."
                    className="mt-1"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            </Card>

            {/* RIGHT: Contact Info */}
            <div className="space-y-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">
                        support@resumind.ai
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-2/10">
                      <Phone className="w-5 h-5 text-chart-2" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        +91 9776543210
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-chart-3/10">
                      <MapPin className="w-5 h-5 text-chart-3" />
                    </div>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        Mumbai, Maharashtra
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/10 to-chart-2/10">
                <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM PST
                  <br />
                  Saturday - Sunday: Closed
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>

          </div>
  );
}
