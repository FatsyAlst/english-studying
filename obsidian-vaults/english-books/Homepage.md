# English Books

My library for English studying: the books, their answer keys and the extra exercises I build around them.

## Library

| Book                                                                     | PDF                                           | Answer key                                               | Extra exercises |
| :----------------------------------------------------------------------- | :-------------------------------------------- | :------------------------------------------------------- | :-------------- |
| **English Grammar in Use**<br>Raymond Murphy · 5th edition, Intermediate | [[english-grammar-in-use.pdf\|Open the book]] | [[english-grammar-in-use-answer-book.pdf\|Open the key]] | 5 sets below    |

## Extra exercises

| Set                           | Book                                | Exercises                                            | Answers                                          |
| :---------------------------- | :---------------------------------- | :--------------------------------------------------- | :----------------------------------------------- |
| **RESPAWN**                   | [[english-grammar-in-use.pdf\|EGU]] | [[review-modules-1-17-exercises.pdf\|PDF]]           | [[review-modules-1-17-answers.pdf\|PDF]]         |
| for · since · when · how long | [[english-grammar-in-use.pdf\|EGU]] | [[for-since-when-how-long-exercises.pdf\|Exercises]] | [[for-since-when-how-long-answers.pdf\|Answers]] |
| have and have got             | [[english-grammar-in-use.pdf\|EGU]] | [[have-have-got-exercises.pdf\|Exercises]]           | [[have-have-got-answers.pdf\|Answers]]           |
| Past perfect                  | [[english-grammar-in-use.pdf\|EGU]] | [[past-perfect-exercises.pdf\|Exercises]]            | [[past-perfect-answers.pdf\|Answers]]            |
| Past perfect continuous       | [[english-grammar-in-use.pdf\|EGU]] | [[past-perfect-continuous-exercises.pdf\|Exercises]] | [[past-perfect-continuous-answers.pdf\|Answers]] |

## Where things go

```
Books/
└─ English Grammar in Use/
   ├─ english-grammar-in-use.pdf
   ├─ english-grammar-in-use-answer-book.pdf
   └─ Extra exercises/
      ├─ review-modules-1-17/        RESPAWN
      ├─ for-since-when-how-long/
      ├─ have-have-got/
      ├─ past-perfect/
      └─ past-perfect-continuous/
```

- One folder per book in `Books/`. The book and its answer key sit in the book folder.
- Each module, topic or review gets its own sub-folder in `Extra exercises/`, with the exercises, the answers and the `.tex` sources side by side.
- File names follow `topic-exercises.pdf` and `topic-answers.pdf`, so a set always has its pair.
- To rebuild a PDF, run `pdflatex` on the `.tex` file twice, so that the references settle.
- Words I want to keep go to the **english-vocabulary** vault. The key icon in the review marks words that come from there.

> [!example]- Adding a new book
> 1. Create `Books/<Book title>/` and drop in the PDF and its answer key.
> 2. Add a row to **Library** above
> 3. Make a sub-folder `Extra exercises/` for anything I build for it.
