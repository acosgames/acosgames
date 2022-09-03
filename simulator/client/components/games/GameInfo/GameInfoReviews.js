import { VStack } from "@chakra-ui/react";
import FSGTextInput from "../widgets/inputs/FSGTextInput";
import GameInfoReviewsItem from './GameInfoReviewsItem';
import fs from 'flatstore';
import { useState } from "react";

function GameInfoReviews(props) {

    const [written, setWritten] = useState('');

    const game = fs.get(props.game_slug);

    const generateReview = (review) => {

        if (reviews.length == 0) {
            return (
                <Heading as="h5" size="lg">No reviews.  Be the first to write a review!</Heading>
            )
        }

        return (
            <GameInfoReviewsItem {...review} />
        )
    }

    const onWriteReview = (e) => {
        setWritten(e.target.value);
    }

    const reviews = game.reviews || [];

    return (
        <VStack width="100%">
            <FSGTextInput title="Write a review" maxLength="120" value={written} onChange={onWriteReview} />

            <VStack>
                {game && game.reviews && game.reviews.map(generateReview)}
            </VStack>
        </VStack>
    )
}

export default GameInfoReviews;