"""Interactive CLI interface for Siraj Mock RAG prototype."""

import sys
from agent.agent import ask

def main():
    print("=" * 60)
    print("      نظام سراج - نموذج الـ Mock RAG التفاعلي")
    print("============================================================")
    print("اكتب سؤالك واستعرض الإجابة والروتر المستدعى (أو اكتب 'خروج' للخروج).")
    print("------------------------------------------------------------")

    while True:
        try:
            user_input = input("\nالسؤال: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ["exit", "quit", "خروج", "إلغاء"]:
                print("تم إنهاء البرنامج.")
                break

            res = ask(user_input, verbose=True)
            print("\n" + "-" * 40)
            print("النتيجة الإجمالية:")
            print(res["answer"])
            print("-" * 40)
        except (KeyboardInterrupt, EOFError):
            print("\nتم إنهاء البرنامج.")
            break

if __name__ == "__main__":
    main()
