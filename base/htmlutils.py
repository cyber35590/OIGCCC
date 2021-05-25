import html2text
import re
import string

def text_stat(text):
    raw = html2text.html2text(text)
    raw = re.sub(r'[^\w\s]', " ", raw)
    raw = re.sub('\s+',' ', raw).rstrip()
    charcount = len(raw)
    wordcount = len(raw.split(" "))
    print("  ")
    print("  ")
    print(raw.split(" "))
    print("  ")
    print("  ")
    print("  ")
    return charcount, wordcount