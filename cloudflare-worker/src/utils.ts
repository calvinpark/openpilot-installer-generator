// src/utils.ts

/**
 * Fills in all occurrences of a placeholder in a binary Uint8Array with a replacement string, padding if necessary.
 *
 * @param placeholder The placeholder string to find and replace.
 * @param replaceWith The string to replace the placeholder with.
 * @param binary The Uint8Array binary data to modify.
 * @param padding The padding character to use if replaceWith is shorter than placeholder.
 * @param argType A descriptive string for the argument type (for error messages).
 * @returns A new Uint8Array with all placeholder occurrences replaced.
 * @throws Error if the replacement string is too long or if the placeholder is not found.
 */
export function fillInArg(placeholder: string, replaceWith: string, binary: Uint8Array, padding: string, argType: string): Uint8Array {
    const placeholderLen = placeholder.length;
    const replaceWithLen = replaceWith.length;

    if (replaceWithLen > placeholderLen) {
        console.error(`Error: ${argType} is too long! Placeholder length: ${placeholderLen}, Replacement length: ${replaceWithLen}`);
        throw new Error(`Invalid ${argType} length: Replacement value exceeds the size of placeholder`);
    }

    const replacedValue = replaceWith + padding.repeat(placeholderLen - replaceWithLen);
    const encodedReplaceWith = new TextEncoder().encode(replacedValue);
    const placeholderBytes = new TextEncoder().encode(placeholder);

    let currentBinary = binary; // Start with the original binary
    let newBinary = new Uint8Array(0); // Initialize an empty Uint8Array to build the result
    let searchIndex = 0;

    while (searchIndex < currentBinary.length) {
        let placeholderIndex = -1;

        // Find the next placeholder in the current binary segment
        for (let i = searchIndex; i <= currentBinary.length - placeholderBytes.length; i++) {
            let match = true;
            for (let j = 0; j < placeholderBytes.length; j++) {
                if (currentBinary[i + j] !== placeholderBytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                placeholderIndex = i;
                break;
            }
        }

        if (placeholderIndex !== -1) {
            // Placeholder found, perform replacement

            // Append the part of the binary before the placeholder to newBinary
            const beforePlaceholder = currentBinary.slice(searchIndex, placeholderIndex);
            const tempNewBinary = new Uint8Array(newBinary.length + beforePlaceholder.length);
            tempNewBinary.set(newBinary, 0);
            tempNewBinary.set(beforePlaceholder, newBinary.length);
            newBinary = tempNewBinary;

            // Append the replacement value to newBinary
            const tempNewBinary2 = new Uint8Array(newBinary.length + encodedReplaceWith.length);
            tempNewBinary2.set(newBinary, 0);
            tempNewBinary2.set(encodedReplaceWith, newBinary.length);
            newBinary = tempNewBinary2;


            // Update searchIndex to start searching after the replaced placeholder
            searchIndex = placeholderIndex + placeholderBytes.length;
            currentBinary = binary; // Reset currentBinary to the original binary for next search from the new searchIndex

        } else {
            // Placeholder not found in the remaining part of the binary
            // Append the rest of the binary to newBinary and exit loop
            const remainingBinary = currentBinary.slice(searchIndex);
            const tempNewBinary = new Uint8Array(newBinary.length + remainingBinary.length);
            tempNewBinary.set(newBinary, 0);
            tempNewBinary.set(remainingBinary, newBinary.length);
            newBinary = tempNewBinary;
            break; // Exit while loop as no more placeholders found
        }
    }

    return newBinary;
}
