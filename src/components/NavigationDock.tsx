import { useState, useEffect, useRef } from "react";
import {
  Camera,
  Music,
  MapPin,
  Heart,
  X,
  Download,
  RefreshCw,
  Share2,
  Check,
  Send,
} from "lucide-react";

// 🎵 استيراد ملف الصوت
import bgMusic from "@/assets/all.m4a";

interface NavigationDockProps {
  active: boolean;
}

type RSVPState =
  | { kind: "form" }
  | { kind: "loading" }
  | { kind: "declined"; name: string }
  | { kind: "error"; msg: string }
  | { kind: "success"; name: string };

const NavigationDock = ({ active }: NavigationDockProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // ===== RSVP =====
  const [showRSVP, setShowRSVP] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<
    "attending" | "declined" | ""
  >("");

  const [rsvpState, setRsvpState] = useState<RSVPState>({
    kind: "form",
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // =========================================================
  // تشغيل الموسيقى تلقائياً فور فتح الظرف
  // =========================================================
  useEffect(() => {
    if (active && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [active]);

  // =========================================================
  // تشغيل / إيقاف الموسيقى
  // =========================================================
  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  // =========================================================
  // فتح الكاميرا
  // =========================================================
  const openCamera = async () => {
    try {
      setShowCamera(true);
      setCapturedImage(null);

      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("يرجى السماح للمتصفح بالوصول إلى الكاميرا.");
      setShowCamera(false);
    }
  };

  // =========================================================
  // إغلاق الكاميرا
  // =========================================================
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    setStream(null);
    setShowCamera(false);
    setCapturedImage(null);
  };

  // =========================================================
  // التقاط الصورة
  // =========================================================
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920;

    const vRatio =
      video.videoWidth / video.videoHeight || 9 / 16;

    const cRatio = canvas.width / canvas.height;

    let renderWidth = canvas.width;
    let renderHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (vRatio > cRatio) {
      renderWidth = canvas.height * vRatio;
      offsetX = (canvas.width - renderWidth) / 2;
    } else {
      renderHeight = canvas.width / vRatio;
      offsetY = (canvas.height - renderHeight) / 2;
    }

    ctx.fillStyle = "#000000";
    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      video,
      offsetX,
      offsetY,
      renderWidth,
      renderHeight
    );

    const gradient = ctx.createLinearGradient(0, canvas.height - 400, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 400, canvas.width, 400);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 96px 'IranNastaliq', sans-serif";

    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillText(
      "عبـدالرحيم & لُجيـن",
      canvas.width / 2,
      canvas.height - 180
    );

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const imageUrl = canvas.toDataURL("image/png");

    setCapturedImage(imageUrl);
  };

  // =========================================================
  // مشاركة الصورة
  // =========================================================
  const handleShare = async () => {
    if (!capturedImage) return;

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const file = new File(
        [blob],
        "wedding-filter.png",
        {
          type: "image/png",
        }
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          files: [file],
          title: "عبـدالرحيم & لُجيـن",
        });
      } else {
        alert(
          "المشاركة غير مدعومة مباشرة على هذا المتصفح، يمكنك استخدام زر الحفظ."
        );
      }
    } catch (error) {
      console.log(
        "إلغاء المشاركة أو خطأ:",
        error
      );
    }
  };

  // =========================================================
  // فتح نافذة RSVP
  // =========================================================
  const openRSVP = () => {
    setShowRSVP(true);

    const savedRSVP =
      localStorage.getItem("guest_rsvp");

    if (savedRSVP) {
      try {
        const data = JSON.parse(savedRSVP);

        if (
          data.name &&
          data.status === "attending"
        ) {
          setGuestName(data.name);
          setRsvpStatus("attending");

          setRsvpState({
            kind: "success",
            name: data.name,
          });

          return;
        }

        if (
          data.name &&
          data.status === "declined"
        ) {
          setGuestName(data.name);
          setRsvpStatus("declined");

          setRsvpState({
            kind: "declined",
            name: data.name,
          });

          return;
        }
      } catch {
        localStorage.removeItem("guest_rsvp");
      }
    }

    setGuestName("");
    setRsvpStatus("");
    setRsvpState({
      kind: "form",
    });
  };

  // =========================================================
  // إرسال RSVP إلى Google Forms الجديد
  // =========================================================
  const submitRSVP = async () => {
    if (!guestName.trim() || !rsvpStatus) {
      return;
    }

    const finalName = guestName.trim();

    setRsvpState({
      kind: "loading",
    });

    try {
      let iframe = document.getElementById(
        "hidden_google_form"
      ) as HTMLIFrameElement | null;

      if (!iframe) {
        iframe = document.createElement("iframe");

        iframe.name = "hidden_google_form";
        iframe.id = "hidden_google_form";

        iframe.style.display = "none";

        document.body.appendChild(iframe);
      }

      const form =
        document.createElement("form");

      form.method = "POST";

      form.action =
        "https://docs.google.com/forms/d/e/1FAIpQLSfCTVkqKySEXLexj8lHidS3fE8Q87ejVuvpzn5t9Z5FsZFClw/formResponse";

      form.target = "hidden_google_form";

      form.style.display = "none";

      const nameInput =
        document.createElement("input");

      nameInput.type = "hidden";
      nameInput.name = "entry.513461549";
      nameInput.value = finalName;

      const statusInput =
        document.createElement("input");

      statusInput.type = "hidden";
      statusInput.name = "entry.1832922715";

      statusInput.value =
        rsvpStatus === "attending"
          ? "تاكيد الحضور"
          : "الاعتذار عن الحضور";

      form.appendChild(nameInput);
      form.appendChild(statusInput);

      document.body.appendChild(form);

      form.submit();

      setTimeout(() => {
        form.remove();
      }, 1000);

      localStorage.setItem(
        "guest_rsvp",
        JSON.stringify({
          name: finalName,
          status: rsvpStatus,
        })
      );

      if (rsvpStatus === "attending") {
        setRsvpState({
          kind: "success",
          name: finalName,
        });

        return;
      }

      setRsvpState({
        kind: "declined",
        name: finalName,
      });
    } catch (error) {
      console.log(
        "Google Forms error:",
        error
      );

      setRsvpState({
        kind: "error",
        msg: "حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.",
      });
    }
  };

  return (
    <>
      {/* =====================================================
          الصوت
      ====================================================== */}
      <audio
        ref={audioRef}
        loop
        src={bgMusic}
        preload="auto"
      />

      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* =====================================================
          شاشة الكاميرا والفلتر
      ====================================================== */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-[500px] aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">

            <button
              onClick={closeCamera}
              className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-md cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-100"
                />

                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-6 text-center bg-gradient-to-t from-black/80 via-black/25 to-transparent">
                  <div className="pb-16 flex flex-col items-center gap-1.5 text-white drop-shadow-2xl">
                    <p
                      style={{
                        fontFamily:
                          "'IranNastaliq', sans-serif",
                      }}
                      className="text-4xl font-bold"
                    >
                      عبـدالرحيم & لُجيـن
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-6 z-20">
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full border-4 border-white/80 bg-white/20 flex items-center justify-center cursor-pointer active:scale-95 transition-transform backdrop-blur-sm"
                  >
                    <div className="w-16 h-16 rounded-full bg-white shadow-xl" />
                  </button>
                </div>
              </>
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center">

                <img
                  src={capturedImage}
                  alt="الصورة الملتقطة"
                  className="w-full h-full object-cover"
                />

                <div className="absolute bottom-6 z-30 w-[90%] max-w-[360px]">
                  <div
                    className="w-full p-4 rounded-3xl backdrop-blur-xl border border-white/30 flex flex-col items-center gap-3 shadow-2xl"
                    style={{
                      background:
                        "rgba(35, 28, 23, 0.82)",
                    }}
                  >
                    <div className="w-full flex items-center justify-center gap-3">

                      <a
                        href={capturedImage}
                        download="wedding-filter.png"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/20 text-white font-arabic text-sm font-semibold transition-all active:scale-95"
                        style={{
                          background:
                            "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <Download className="w-4 h-4" />
                        حفظ
                      </a>

                      <button
                        onClick={() =>
                          setCapturedImage(null)
                        }
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/20 text-white font-arabic text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                        style={{
                          background:
                            "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <RefreshCw className="w-4 h-4" />
                        إعادة
                      </button>
                    </div>

                    <button
                      onClick={handleShare}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-arabic text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
                      style={{
                        backgroundColor: "#8C7A6B",
                        color: "#FFFFFF",
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      مشاركة
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
          نافذة تأكيد الحضور
      ====================================================== */}
      {showRSVP && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">

          <div
            className="absolute inset-0 bg-black/25 backdrop-blur-md"
            onClick={() =>
              setShowRSVP(false)
            }
          />

          <div
            className="relative w-full max-w-[380px] max-h-[90vh] overflow-y-auto rounded-[32px] px-7 py-8 shadow-2xl border border-white/30"
            style={{
              background:
                "rgba(245, 239, 231, 0.96)",
              color: "#5F4F41",
            }}
          >

            <div className="absolute top-3 right-4 text-xl opacity-60">
              ❈
            </div>

            <div className="absolute top-3 left-4 text-xl opacity-60">
              ❈
            </div>

            {rsvpState.kind === "success" && (
              <div className="text-center py-6">

                <div className="text-4xl mb-4">
                  ♡
                </div>

                <h2
                  className="text-2xl font-bold mb-3"
                  style={{
                    fontFamily:
                      "'IranNastaliq', sans-serif",
                  }}
                >
                  تم تأكيد حضوركم
                </h2>

                <p
                  className="text-sm leading-8"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  أهلاً وسهلاً، {rsvpState.name}
                  <br />
                  سعداء بتأكيد حضوركم
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowRSVP(false)
                  }
                  className="w-full mt-7 py-3.5 rounded-2xl font-bold cursor-pointer"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    background: "#5F4F41",
                    color: "#FFFFFF",
                  }}
                >
                  العودة إلى الدعوة
                </button>

                <div className="absolute bottom-3 right-4 text-xl opacity-60">
                  ❈
                </div>

                <div className="absolute bottom-3 left-4 text-xl opacity-60">
                  ❈
                </div>
              </div>
            )}

            {rsvpState.kind === "declined" && (
              <div className="text-center py-6">

                <Heart
                  className="mx-auto w-10 h-10 mb-4"
                  style={{
                    color: "#806F63",
                    fill: "#806F63",
                  }}
                />

                <h2
                  className="text-2xl font-bold mb-4"
                  style={{
                    fontFamily:
                      "'IranNastaliq', sans-serif",
                  }}
                >
                  تم تسجيل اعتذاركم
                </h2>

                <p
                  className="text-sm leading-8"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  نقدّر اعتذارك يا {rsvpState.name}
                  <br />
                  ونراك في مناسبة أخرى بإذن الله
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowRSVP(false)
                  }
                  className="w-full mt-7 py-3.5 rounded-2xl font-bold cursor-pointer"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    background: "#5F4F41",
                    color: "#FFFFFF",
                  }}
                >
                  العودة إلى الدعوة
                </button>
              </div>
            )}

            {rsvpState.kind === "error" && (
              <>
                <div className="text-center mb-6">

                  <div className="text-3xl mb-3">
                    !
                  </div>

                  <h2
                    className="text-xl font-bold"
                    style={{
                      fontFamily:
                        "'IranNastaliq', sans-serif",
                    }}
                  >
                    تعذر إتمام الطلب
                  </h2>

                  <p
                    className="mt-3 text-sm leading-7"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                    }}
                  >
                    {rsvpState.msg}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setRsvpState({
                      kind: "form",
                    })
                  }
                  className="w-full py-3.5 rounded-2xl font-bold cursor-pointer"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    background: "#5F4F41",
                    color: "#FFFFFF",
                  }}
                >
                  العودة
                </button>
              </>
            )}

            {rsvpState.kind === "loading" && (
              <div className="text-center py-12">

                <div
                  className="mx-auto w-10 h-10 rounded-full border-4 border-[#5F4F41]/20 border-t-[#5F4F41] animate-spin mb-5"
                />

                <p
                  className="text-sm font-bold"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                  }}
                >
                  جارٍ تسجيل طلبكم...
                </p>
              </div>
            )}

            {rsvpState.kind === "form" && (
              <>
                <div className="text-center mb-7">

                  <h2
                    className="text-2xl font-bold"
                    style={{
                      fontFamily:
                        "'IranNastaliq', sans-serif",
                    }}
                  >
                    تأكيـد الحضور
                  </h2>

                  <p
                    className="mt-2 text-sm"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                    }}
                  >
                    يسعدنا ويشرفنا حضوركم
                  </p>
                </div>

                <div className="mb-5">

                  <label
                    className="block text-right mb-2 text-sm font-bold"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                    }}
                  >
                    الاسم الكريم
                  </label>

                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) =>
                      setGuestName(e.target.value)
                    }
                    placeholder="اكتب اسمك"
                    className="w-full rounded-2xl px-4 py-3 text-right outline-none border"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      background:
                        "rgba(255,255,255,0.65)",
                      borderColor:
                        "rgba(95,79,65,0.25)",
                      color: "#5F4F41",
                    }}
                    dir="rtl"
                  />
                </div>

                <div className="flex gap-3 mb-6">

                  <button
                    type="button"
                    onClick={() => {
                      setRsvpStatus("attending");
                      setRsvpState({
                        kind: "form",
                      });
                    }}
                    className="flex-1 py-3 rounded-2xl border transition-all flex items-center justify-center gap-1 cursor-pointer"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      background:
                        rsvpStatus === "attending"
                          ? "#5F4F41"
                          : "rgba(255,255,255,0.65)",
                      color:
                        rsvpStatus === "attending"
                          ? "#FFFFFF"
                          : "#5F4F41",
                      borderColor:
                        "#5F4F41",
                    }}
                  >
                    <Check className="w-4 h-4" />
                    تأكيد الحضور
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRsvpStatus("declined");
                      setRsvpState({
                        kind: "form",
                      });
                    }}
                    className="flex-1 py-3 rounded-2xl border transition-all flex items-center justify-center gap-1 cursor-pointer"
                    style={{
                      fontFamily:
                        "'Almarai', sans-serif",
                      background:
                        rsvpStatus === "declined"
                          ? "#5F4F41"
                          : "rgba(255,255,255,0.65)",
                      color:
                        rsvpStatus === "declined"
                          ? "#FFFFFF"
                          : "#5F4F41",
                      borderColor:
                        "#5F4F41",
                    }}
                  >
                    <X className="w-4 h-4" />
                    الاعتذار عن الحضور
                  </button>
                </div>

                <button
                  type="button"
                  onClick={submitRSVP}
                  disabled={
                    !guestName.trim() ||
                    !rsvpStatus ||
                    rsvpState.kind === "loading"
                  }
                  className="w-full py-3.5 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    background: "#5F4F41",
                    color: "#FFFFFF",
                  }}
                >
                  {rsvpState.kind === "loading" ? (
                    "جارٍ الإرسال..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" />
                      إرسال
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowRSVP(false)
                  }
                  className="w-full mt-3 py-2 text-sm cursor-pointer"
                  style={{
                    fontFamily:
                      "'Almarai', sans-serif",
                    color: "#5F4F41",
                  }}
                >
                  إلغاء
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-4 text-xl opacity-60">
              ❈
            </div>

            <div className="absolute bottom-3 left-4 text-xl opacity-60">
              ❈
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          الشريط السفلي
      ====================================================== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md pointer-events-auto">

        <div
          className="w-full px-3 py-2.5 rounded-3xl border border-white/50 shadow-2xl flex items-center justify-around backdrop-blur-md"
          style={{
            background:
              "rgba(255, 255, 255, 0.45)",
            boxShadow:
              "0 10px 30px rgba(95, 79, 65, 0.2)",
          }}
        >

          {/* 1. موسيقى */}
          <button
            onClick={toggleMusic}
            className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95"
          >
            <Music
              className={`w-5 h-5 transition-opacity ${
                isPlaying
                  ? "opacity-100 animate-pulse"
                  : "opacity-50"
              }`}
              style={{
                color: "#5F4F41",
              }}
            />

            <span
              className="font-arabic text-[11px] font-bold"
              style={{
                color: "#5F4F41",
              }}
            >
              موسيقى
            </span>
          </button>

          {/* 2. كاميرا */}
          <button
            onClick={openCamera}
            className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95"
          >
            <Camera
              className="w-5 h-5"
              style={{
                color: "#5F4F41",
              }}
            />

            <span
              className="font-arabic text-[11px] font-bold"
              style={{
                color: "#5F4F41",
              }}
            >
              كاميرا
            </span>
          </button>

          {/* 3. الدائرة البنية في المنتصف */}
          <div className="relative -top-2 flex flex-col items-center justify-center pointer-events-none">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white/40"
              style={{
                background: "#5F4F41",
              }}
            >
              <svg
                className="w-6 h-6 fill-white text-white"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>

          {/* 4. الموقع (معدل ليصبح رابطاً مباشراً وآمناً للجوالات) */}
          <a
            href="https://www.google.com/maps/search/?api=1&query=قاعة+مون+لايت+جدة"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95 no-underline"
          >
            <MapPin
              className="w-5 h-5"
              style={{
                color: "#5F4F41",
              }}
            />

            <span
              className="font-arabic text-[11px] font-bold"
              style={{
                color: "#5F4F41",
              }}
            >
              الموقع
            </span>
          </a>

          {/* 5. تأكيد الحضور */}
          <button
            onClick={openRSVP}
            className="flex flex-col items-center justify-center gap-1 cursor-pointer transition-transform active:scale-95"
          >
            <Heart
              className="w-5 h-5"
              style={{
                color: "#5F4F41",
              }}
            />

            <span
              className="font-arabic text-[11px] font-bold"
              style={{
                color: "#5F4F41",
              }}
            >
              تأكيد الحضور
            </span>
          </button>

        </div>
      </div>
    </>
  );
};

export default NavigationDock;
